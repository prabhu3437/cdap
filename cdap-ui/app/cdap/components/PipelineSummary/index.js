/*
 * Copyright © 2017 Cask Data, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
*/

import React, {Component, PropTypes} from 'react';
import {fetchSummary} from 'components/PipelineSummary/PipelineSummaryActions';
import PipelineSummaryStore from 'components/PipelineSummary/PipelineSummaryStore';
import {convertProgramToApi} from 'services/program-api-converter';
import RunsHistoryGraph from 'components/PipelineSummary/RunsHistoryGraph';
import LogsMetricsGraph from 'components/PipelineSummary/LogsMetricsGraph';
// import NodesMetricsGraph from 'components/PipelineSummary/NodesMetricsGraph';
import { DropdownToggle, DropdownItem } from 'reactstrap';
import CustomDropdownMenu from 'components/CustomDropdownMenu';
import {UncontrolledDropdown} from 'components/UncontrolledComponents';
import IconSVG from 'components/IconSVG';
import T from 'i18n-react';

const PREFIX = 'features.PipelineSummary';

require('./PipelineSummary.scss');
const ONE_DAY_SECONDS = 86400;

export default class PipelineSummary extends Component {
  constructor(props) {
    super(props);
    let {namespaceId, appId, programType, programId, pipelineConfig} = props;
    this.state = {
      runs: [],
      logsMetrics: [],
      nodesMetrics: [],
      totalRunsCount: 0,
      runsLimit: 10,
      filterType: 'limit',
      start: 0,
      activeRunsFilter: 'Last 10 runs',
      loading: true
    };
    this.fetchRunsByLimit = this.fetchRunsByLimit.bind(this);
    this.fetchRunsByTime = this.fetchRunsByTime.bind(this);
    const RUNSFILTERPREFIX = `${PREFIX}.runsFilter`;
    this.runsDropdown = [
      {
        label: T.translate(`${RUNSFILTERPREFIX}.last10Runs`),
        onClick: this.fetchRunsByLimit.bind(this, 10)
      },
      {
        label: T.translate(`${RUNSFILTERPREFIX}.last50Runs`),
        onClick: this.fetchRunsByLimit.bind(this, 50)
      },
      {
        label: T.translate(`${RUNSFILTERPREFIX}.last100Runs`),
        onClick: this.fetchRunsByLimit.bind(this, 100)
      },
      {
        label: 'divider'
      },
      {
        label: T.translate(`${RUNSFILTERPREFIX}.last1Day`),
        onClick: this.fetchRunsByTime.bind(this, ONE_DAY_SECONDS)
      },
      {
        label: T.translate(`${RUNSFILTERPREFIX}.last7Days`),
        onClick: this.fetchRunsByTime.bind(this, ONE_DAY_SECONDS * 7)
      },
      {
        label: T.translate(`${RUNSFILTERPREFIX}.last30Days`),
        onClick: this.fetchRunsByTime.bind(this, ONE_DAY_SECONDS * 30)
      },
      {
        label: T.translate(`${RUNSFILTERPREFIX}.sinceInception`),
        onClick: this.fetchRunsByTime.bind(this)
      }
    ];
    fetchSummary({
      namespaceId,
      appId,
      programType: convertProgramToApi(programType),
      programId,
      pipelineConfig,
      limit: this.state.runsLimit
    });
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.totalRunsCount !== this.state.totalRunsCount) {
      this.setState({
        totalRunsCount: nextProps.totalRunsCount
      });
    }
  }
  componentDidMount() {
    this.storeSubscription = PipelineSummaryStore.subscribe(() => {
      let {runs, loading} = PipelineSummaryStore.getState().pipelinerunssummary;
      let logsMetrics = runs.map(run => ({
        runid: run.runid,
        logsMetrics: run.logsMetrics,
        start: run.start,
        end: run.end
      }));
      let nodesMetrics = runs.map(run => ({
        runid: run.runid,
        nodesMetrics: run.nodesMetrics,
        start: run.start,
        end: run.end
      }));
      runs = runs.map(run => ({
        runid: run.runid,
        duration: run.duration,
        start: run.start,
        end: run.end,
        status: run.status
      }));
      let state = {
        runs,
        logsMetrics,
        nodesMetrics,
        loading,
        totalRunsCount: runs.length
      };
      if (this.state.filterType === 'time') {
        state = Object.assign({}, state, {
          limit: runs.length
        });
      }
      this.setState(state);
    });
  }
  fetchRunsByLimit(limit, filterLabel) {
    this.setState({
      runsLimit: limit,
      activeRunsFilter: filterLabel,
      filterType: 'limit'
    });
    let {namespaceId, appId, programType, programId, pipelineConfig} = this.props;
    fetchSummary({
      namespaceId,
      appId,
      programType: convertProgramToApi(programType),
      programId,
      pipelineConfig,
      limit
    });
  }
  fetchRunsByTime(time, filterLabel) {
    this.setState({
      activeRunsFilter: filterLabel,
      filterType: 'time'
    });
    let end = Math.floor(Date.now() / 1000);
    let start = end - time;
    let {namespaceId, appId, programType, programId, pipelineConfig} = this.props;
    fetchSummary({
      namespaceId,
      appId,
      programType: convertProgramToApi(programType),
      programId,
      pipelineConfig,
      start,
      end
    });
  }
  render() {
    // FIXME: Right now run time stats and schedule summary are dummy. Will change in subsequent PR.
    return (
      <div className="pipeline-summary">
        <div className="top-title-bar">
          <div> {T.translate(`${PREFIX}.title`)}</div>
          <div className="stats-container text-xs-right">
            <span>
              <strong>{T.translate(`${PREFIX}.statsContainer.totalRuns`)} </strong>
              {this.state.totalRunsCount}
            </span>
            <span className="run-times">
              <strong className="run-time-label">
                {T.translate(`${PREFIX}.statsContainer.runTime`)}:
              </strong>
              <strong>{T.translate(`${PREFIX}.statsContainer.min`)}</strong>
              <span>1:56</span>
              <strong> {T.translate(`${PREFIX}.statsContainer.max`)} </strong>
              <span>3:03</span>
              <strong> {T.translate(`${PREFIX}.statsContainer.avg`)} </strong>
              <span>2:16 min</span>
            </span>
            <span>
              <strong> {T.translate(`${PREFIX}.statsContainer.currentSchedule`)} </strong>
              <span> Runs every 20 min past the hour </span>
            </span>
          </div>
        </div>
        <div className="filter-container">
          <span> {T.translate(`${PREFIX}.filterContainer.view`)} </span>
          <UncontrolledDropdown className="runs-dropdown">
            <DropdownToggle caret>
              <span>{this.state.activeRunsFilter}</span>
              <IconSVG name="icon-chevron-down" />
            </DropdownToggle>
            <CustomDropdownMenu>
              {
                this.runsDropdown.map(dropdown => {
                  if (dropdown.label === 'divider') {
                    return (
                      <DropdownItem
                        tag="li"
                        divider
                      />
                    );
                  }
                  return (
                    <DropdownItem
                      tag="li"
                      onClick={dropdown.onClick.bind(this, dropdown.label)}
                    >
                      {
                        dropdown.label
                      }
                    </DropdownItem>
                  );
                })
              }
            </CustomDropdownMenu>
          </UncontrolledDropdown>
        </div>
        <div className="graphs-container">
          <RunsHistoryGraph
            totalRunsCount={this.state.totalRunsCount}
            runs={this.state.runs}
            runsLimit={this.state.runsLimit}
            xDomainType={this.state.filterType}
            runContext={this.props}
            isLoading={this.state.loading}
          />
          <LogsMetricsGraph
            totalRunsCount={this.state.totalRunsCount}
            runs={this.state.logsMetrics}
            runsLimit={this.state.runsLimit}
            xDomainType={this.state.filterType}
            runContext={this.props}
            isLoading={this.state.loading}
          />
          {
            /* {<NodesMetricsGraph
            totalRunsCount={this.state.totalRunsCount}
            runs={this.state.nodesMetrics}
            runsLimit={this.state.runsLimit}
          />} */
          }
        </div>
      </div>
    );
  }
}

PipelineSummary.propTypes = {
  namespaceId: PropTypes.string.isRequired,
  appId: PropTypes.string.isRequired,
  programType: PropTypes.string.isRequired,
  programId: PropTypes.string.isRequired,
  pipelineConfig: PropTypes.object.isRequired,
  totalRunsCount: PropTypes.number
};