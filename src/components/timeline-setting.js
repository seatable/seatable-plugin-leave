import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import moment from 'moment';
import intl from 'react-intl-universal';
import Picker from '@seafile/seafile-calendar/lib/Picker';
import RangeCalendar from '@seafile/seafile-calendar/lib/RangeCalendar';
import PluginSelect from './plugin-select';
import { translateCalendar } from '../utils/seafile-calendar-translate';
import { SETTING_KEY, zIndexes, RECORD_END_TYPE, GRID_VIEWS, DATE_UNIT, DATE_FORMAT } from '../constants';

import '@seafile/seafile-calendar/assets/index.css';
import '../css/timeline-setting.css';

const RECORD_END_TYPES = [RECORD_END_TYPE.END_TIME, RECORD_END_TYPE.RECORD_DURATION];

const propTypes = {
  tables: PropTypes.array,
  views: PropTypes.array,
  nameColumns: PropTypes.array,
  singleSelectColumns: PropTypes.array,
  dateColumns: PropTypes.array,
  numberColumns: PropTypes.array,
  settings: PropTypes.object,
  gridStartDate: PropTypes.string,
  gridEndDate: PropTypes.string,
  selectedGridView: PropTypes.string,
  onModifyTimelineSettings: PropTypes.func,
  onHideTimelineSetting: PropTypes.func,
  updateDateRange: PropTypes.func,
};

class TimelineSetting extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      dateRange: [moment(props.gridStartDate), moment(props.gridEndDate)],
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.gridStartDate !== this.props.gridStartDate ||
      nextProps.gridEndDate !== this.props.gridEndDate) {
      this.setState({
        dateRange: [moment(nextProps.gridStartDate), moment(nextProps.gridEndDate)]
      });
    }
  }

  renderSelector = (source, settingKey, valueKey, labelKey) => {
    let { settings } = this.props;
    let options = source.map((item) => {
      let value = item[valueKey];
      let label = item[labelKey];
      return {value, label, setting_key: settingKey};
    });
    let selectedOption = options.find(item => item.value === settings[settingKey]);
    if (!selectedOption && (settingKey === SETTING_KEY.TABLE_NAME || settingKey === SETTING_KEY.VIEW_NAME)) {
      selectedOption = options[0];
    }
    return (
      <PluginSelect
        value={selectedOption}
        options={options}
        onChange={this.onModifySettings}
      />
    );
  }

  renderRecordEndType = () => {
    let { settings } = this.props;
    let { record_end_type } = settings;
    record_end_type = record_end_type || RECORD_END_TYPE.END_TIME;
    return RECORD_END_TYPES.map((r) => {
      let displayType = r === RECORD_END_TYPE.END_TIME ? 'End_date' : 'Duration';
      return (
        <div
          key={`record_end_type_${r}`}
          onClick={() => this.onSelectRecordEndType(r)}
          className={classnames({
            'record-end-type-item': true,
            'selected': r === record_end_type,
          })}
        >
          <span>{intl.get(displayType)}</span>
        </div>
      );
    });
  }

  renderRecordEndItem = () => {
    let { settings, dateColumns, numberColumns } = this.props;
    let { record_end_type } = settings;
    record_end_type = record_end_type || RECORD_END_TYPE.END_TIME;
    if (record_end_type === RECORD_END_TYPE.RECORD_DURATION) {
      return (
        <div className="setting-item record-duration">
          {this.renderSelector(numberColumns, SETTING_KEY.RECORD_DURATION_COLUMN_NAME, 'name', 'name')}
        </div>
      );
    }
    return (
      <div className="setting-item end-time">
        {this.renderSelector(dateColumns, SETTING_KEY.END_TIME_COLUMN_NAME, 'name', 'name')}
      </div>
    );
  }

  onModifySettings = (selectedOption, evt) => {
    let { settings } = this.props;
    let { setting_key, value } = selectedOption;
    let updated;
    if (setting_key === SETTING_KEY.TABLE_NAME) {
      updated = {[setting_key]: value};  // Need init settings after select new table.
    } else {
      updated = Object.assign({}, settings, {[setting_key]: value});
    }
    this.props.onModifyTimelineSettings(updated);
  };

  onSelectRecordEndType = (recordEndType) => {
    let { settings } = this.props;
    let updated =  Object.assign({}, settings, {[SETTING_KEY.RECORD_END_TYPE]: recordEndType});
    this.props.onModifyTimelineSettings(updated);
  }

  renderDatePicker = () => {
    const { dateRange } = this.state;
    return (
      <Picker
        value={dateRange}
        calendar={this.renderRangeCalendar()}
        style={{ zIndex: zIndexes.RC_CALENDAR }}
        onOpenChange={this.onOpenChange}
        onChange={this.onDatePickerChange}
      >
        {
          ({ value }) => {
            return (
              <span>
                <input
                  readOnly
                  className="ant-calendar-picker-input ant-input"
                  value={value && value[0] && value[1] ? `${value[0].format('YYYY')} - ${value[1].format('YYYY')}` : ''}
                />
              </span>
            );
          }
        }
      </Picker>
    );
  }

  renderRangeCalendar = () => {
    const { dateRange } = this.state;
    return (
      <RangeCalendar
        className={'timeline-date-range-calendar'}
        locale={translateCalendar()}
        showToday={false}
        mode={[DATE_UNIT.YEAR, DATE_UNIT.YEAR]}
        format={DATE_FORMAT.YEAR}
        defaultValue={dateRange}
        onPanelChange={this.onChangeSelectedRangeDates}
      />
    );
  }

  disabledDate = (current) => {
    const { dateRange } = this.state;
    if (!dateRange || dateRange.length === 0) {
      return false;
    }
    const tooLate = dateRange[0] && current.diff(dateRange[0], DATE_UNIT.YEAR) > 3;
    const tooEarly = dateRange[1] && dateRange[1].diff(current, DATE_UNIT.YEAR) > 3;
    return tooEarly || tooLate;
  }

  onDatePickerChange = (dates) => {
    this.setState({dateRange: dates});
  }

  onChangeSelectedRangeDates = (dates) => {
    this.setState({dateRange: dates});
  }

  onOpenChange = (open) => {
    if (!open) {
      const { dateRange } = this.state;
      const { selectedGridView, gridStartDate, gridEndDate } = this.props;

      // not changed.
      if (dateRange[0].isSame(gridStartDate) && dateRange[1].isSame(gridEndDate)) {
        return;
      }

      // not allowed date range.
      const startDate = dateRange[0].startOf(DATE_UNIT.YEAR).format(DATE_FORMAT.YEAR_MONTH_DAY);
      const endDate = dateRange[1].endOf(DATE_UNIT.YEAR).format(DATE_FORMAT.YEAR_MONTH_DAY);
      const diffs = dateRange[1].diff(dateRange[0], DATE_UNIT.YEAR);
      if ((selectedGridView === GRID_VIEWS.YEAR && diffs < 2) ||
        ((selectedGridView === GRID_VIEWS.MONTH || selectedGridView === GRID_VIEWS.DAY) &&
        dateRange[1].isBefore(dateRange[0]))
      ) {
        const { gridStartDate, gridEndDate } = this.props;
        this.setState({
          dateRange: [moment(gridStartDate), moment(gridEndDate)]
        });
        return;
      }

      this.props.updateDateRange(startDate, endDate);
    }
  }

  render() {
    let { tables, views, nameColumns, singleSelectColumns, dateColumns, onHideTimelineSetting } = this.props;
    return (
      <div className="plugin-timeline-setting" style={{zIndex: zIndexes.TIMELINE_SETTING}} ref={ref => this.timelineSetting = ref} onClick={this.onClick}>
        <div className="setting-container">
          <div className="setting-header">
            <div className="setting-header-container">
              <div className="setting-header-title">{intl.get('Settings')}</div>
              <div className="dtable-font dtable-icon-x btn-close" onClick={onHideTimelineSetting}></div>
            </div>
          </div>
          <div className="setting-body">
            <div className="setting-list">
              <div className="setting-item table">
                <div className="title">{intl.get('Table')}</div>
                {this.renderSelector(tables, SETTING_KEY.TABLE_NAME, 'name', 'name')}
              </div>
              <div className="setting-item table-view">
                <div className="title">{intl.get('View')}</div>
                {this.renderSelector(views, SETTING_KEY.VIEW_NAME, 'name', 'name')}
              </div>
              <div className="split-line"></div>
              <div className="setting-item name">
                <div className="title">{intl.get('Name_column')}</div>
                {this.renderSelector(nameColumns, SETTING_KEY.NAME_COLUMN_NAME, 'name', 'name')}
              </div>
              <div className="setting-item color">
                <div className="title">{intl.get('Color_column')}</div>
                {this.renderSelector(singleSelectColumns, SETTING_KEY.SINGLE_SELECT_COLUMN_NAME, 'name', 'name')}
              </div>
              <div className="split-line"></div>
              <div className="setting-item start-time">
                <div className="title">{intl.get('Start_date')}</div>
                {this.renderSelector(dateColumns, SETTING_KEY.START_TIME_COLUMN_NAME, 'name', 'name')}
              </div>
              <div className="split-line"></div>
              <div className="setting-item record-end-type">{this.renderRecordEndType()}</div>
              {this.renderRecordEndItem()}
              <div className="split-line"></div>
              <div className="setting-item date-range">
                <div className="title">{intl.get('Date_range')}</div>
                <div className="btn-date-range">
                  {this.renderDatePicker()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

TimelineSetting.propTypes = propTypes;

export default TimelineSetting;