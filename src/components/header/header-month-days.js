import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { dates } from '../../utils';
import { DATE_UNIT } from '../../constants';

const propTypes = {
  isToday: PropTypes.bool,
  overscanDays: PropTypes.array,
  rows: PropTypes.array,
};

class HeaderMonthDays extends React.Component {

  render() {
    let { isToday, overscanDays, rows } = this.props;
    let todayMarkLeft = dates.getDaysInRange(overscanDays[0], moment().format('YYYY-MM-DD')).length * 40 + (40 - 6) / 2;
    return (
      <div className="header-month-days position-relative d-inline-flex">
        {overscanDays.map((d) => {
          let week = dates.getDate2Week(d);
          let day = dates.getDateWithUnit(d, DATE_UNIT.DAY);
          return (
            <div className="day-item d-flex flex-column" name={d} key={`day-item-${d}`}>
              <span key={`week-${d}`} className="week d-flex align-items-center justify-content-center">{week}</span>
              <span key={`day-${d}`} className="day d-flex align-items-center justify-content-center">{day}</span>
            </div>
          );
        })}
        {(isToday && rows && rows.length > 0) &&
          <div className="today-mark position-absolute" style={{left: todayMarkLeft}}></div>
        }
      </div>
    );
  }
}

HeaderMonthDays.propTypes = propTypes;

export default HeaderMonthDays;