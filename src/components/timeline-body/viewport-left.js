import React from 'react';
import PropTypes from 'prop-types';
import CanvasLeft from './canvas-left';
import GroupCanvasLeft from './group-canvas-left';
import ColumnManager from './column-manager';
import ColumnsShown from './columns-shown';

class ViewportLeft extends React.Component {

  componentDidMount() {
    const { prevScrollTop } = this.props;
    if (prevScrollTop > 0) {
      this.setCanvasLeftScroll(prevScrollTop);
    }
  }

  renderCanvasLeft = (shownColumns) => {
    let { isGroupView, groupVisibleStartIdx, renderedRows, groups, onExpandGroupToggle, foldedGroups, collaborators, dtable, tableID, tables, formulaRows, topOffset, bottomOffset } = this.props;
    let CustomCanvasLeft, canvasLeftProps;
    if (isGroupView) {
      CustomCanvasLeft = GroupCanvasLeft;
      canvasLeftProps = { groupVisibleStartIdx, groups, foldedGroups, onExpandGroupToggle, shownColumns, collaborators, dtable, tableID, tables, formulaRows, topOffset, bottomOffset };
    } else {
      CustomCanvasLeft = CanvasLeft;
      canvasLeftProps = { renderedRows, shownColumns, collaborators, dtable, tableID, tables, formulaRows, topOffset, bottomOffset };
    }
    return (
      <CustomCanvasLeft {...canvasLeftProps} />
    );
  }

  onViewportLeftScroll = (evt) => {
    if (!this.activeScroll) {
      this.activeScroll = true;
      return;
    }
    this.props.onViewportLeftScroll(evt.target.scrollTop);
  }

  setCanvasLeftScroll = (scrollTop) => {
    this.activeScroll = false;
    this.viewportLeft.scrollTop = scrollTop;
  }

  updateColumn = (targetColumnKey, targetShown) => {
    const { settings } = this.props;
    settings.columns = this.configuredColumns.map(item => {
      if (item.key == targetColumnKey) {
        item.shown = targetShown;
      }
      return item;
    });
    this.props.onModifyTimelineSettings(settings);
  }

  moveColumn = (targetColumnKey, targetIndexColumnKey) => {
    const { settings } = this.props;
    const configuredColumns = this.configuredColumns;
    const targetColumn = configuredColumns.filter(column => column.key == targetColumnKey)[0];
    const originalIndex = configuredColumns.indexOf(targetColumn);
    const targetIndexColumn = configuredColumns.filter(column => column.key == targetIndexColumnKey)[0];
    const targetIndex = configuredColumns.indexOf(targetIndexColumn);
    configuredColumns.splice(originalIndex, 1);
    configuredColumns.splice(targetIndex, 0, targetColumn);
    settings.columns = configuredColumns;
    this.props.onModifyTimelineSettings(settings);
  }

  getCurrentConfiguredColumns = () => {
    const { columns, settings } = this.props;
    const initialConfiguredColumns = columns.map((item, index) => {
      return {
        key: item.key,
        shown: index == 0 // show the first column by default
      };
    });

    let configuredColumns = initialConfiguredColumns;
    if (settings.columns) {
      const baseConfiguredColumns = settings.columns.filter(item => {
        return columns.some(c => item.key == c.key);
      });
      const addedColumns = columns
        .filter(item => !baseConfiguredColumns.some(c => item.key == c.key))
        .map(item => ({key: item.key, shown: false}));
      configuredColumns = baseConfiguredColumns.concat(addedColumns);
    }
    return configuredColumns;
  }

  render() {
    const { columns, isGroupView } = this.props;
    this.configuredColumns = this.getCurrentConfiguredColumns();
    const configuredColumns = this.configuredColumns.map((item, index) => {
      const targetItem = columns.filter(c => c.key == item.key)[0];
      return Object.assign({}, targetItem, item);
    });
    const shownColumns = configuredColumns.filter(item => item.shown);
    return (
      <div className="timeline-viewport-left d-flex flex-column">
        <div>
          <ColumnManager
            columns={configuredColumns}
            updateColumn={this.updateColumn}
            moveColumn={this.moveColumn}
          />
          <ColumnsShown columns={shownColumns} isGroupView={isGroupView} />
        </div>
        <div className="canvas-left-wrapper flex-fill o-auto" ref={ref => this.viewportLeft = ref} onScroll={this.onViewportLeftScroll}>
          {this.renderCanvasLeft(shownColumns)}
        </div>
      </div>
    );
  }
}

ViewportLeft.propTypes = {
  isGroupView: PropTypes.bool,
  renderedRows: PropTypes.array,
  groupVisibleStartIdx: PropTypes.number,
  groups: PropTypes.array,
  foldedGroups: PropTypes.array,
  topOffset: PropTypes.number,
  bottomOffset: PropTypes.number,
  onViewportLeftScroll: PropTypes.func,
  onExpandGroupToggle: PropTypes.func,
};

export default ViewportLeft;
