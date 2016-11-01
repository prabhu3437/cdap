/*
 * Copyright © 2016 Cask Data, Inc.
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
import React, {PropTypes, Component} from 'react';
import {MyMarketApi} from '../../api/market';
import Card from 'components/Card';
import moment from 'moment';
import T from 'i18n-react';
import classnames from 'classnames';
import shortid from 'shortid';
require('./MarketPlaceUsecaseEntity.less');
import getIcon from 'services/market-action-icon-map';
import AbstractWizard from 'components/AbstractWizard';

export default class MarketPlaceUsecaseEntity extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showActions: false,
      loadingActions: false,
      entityDetail: {},
      wizard: {
        actionIndex: null,
        actionType: null,
        action: null
      },
      completedActions: []
    };
  }

  closeWizard(returnResult) {
    if (returnResult) {
      this.setState({
        completedActions: this.state.completedActions.concat([this.state.wizard.actionIndex]),
        wizard: {
          actionIndex: null,
          actionType: null,
          action: null
        }
      });
      return;
    }
    this.setState({
      wizard: {
        actionIndex: null,
        actionType: null
      }
    });
  }

  openWizard(actionIndex, actionType, action) {
    this.setState({
      wizard: {
        actionIndex,
        actionType,
        action
      }
    });
  }

  getVersion() {
    const versionElem = (
      <span>
        <strong>
          {this.props.entity.cdapVersion}
        </strong>
      </span>
    );

    return this.props.entity.cdapVersion ? versionElem : null;
  }

  fetchEntityDetail() {
    if (this.state.showActions) {
      this.setState({ showActions: false });
      return;
    }
    this.setState({
      loadingActions: true,
      showActions: true
    });
    MyMarketApi.get({
      packageName: this.props.entity.name,
      version: this.props.entity.version
    }).subscribe((res) => {
      this.setState({
        entityDetail: res,
        loadingActions: false
      });
    }, (err) => {
      console.log('Error', err);
      this.setState({loadingActions: false});
    });
  }

  getActions() {
    if (this.state.loadingActions) {
      return (
        <div className="market-entity-actions text-center">
          <h3 className="fa fa-spin fa-refresh"></h3>
        </div>
      );
    }

    return (
      <div className="market-entity-actions">
        {
          this.state.entityDetail.actions.map((action, index) => {
            let isCompletedAction = this.state.completedActions.indexOf(index) !== -1 ;
            let actionName = T.translate('features.Market.action-types.' + action.type + '.name');
            let actionIcon = getIcon(action.type);
            return (
              <div
                className="action-container text-center"
                key={shortid.generate()}
                onClick={this.openWizard.bind(this, index, action.type, action)}
              >
                <div
                  className="action"
                  key={index}
                >
                  <div className="step text-center">
                    <span className={classnames("badge", {'completed' : isCompletedAction})}>{index + 1}</span>
                  </div>
                  <div className="action-icon">
                    <div className={classnames("fa", actionIcon)}></div>
                  </div>
                  <div className="action-description">
                    {action.label}
                  </div>
                  <button
                    className={classnames("btn btn-link", {'btn-completed': isCompletedAction})}
                  >
                    { actionName }
                  </button>
                </div>
              </div>
            );
          })
        }
      </div>
    );
  }

  render() {
    return (
      <Card
        size="LG"
        cardClass="market-place-usecase-package-card"
      >
        <div className="title clearfix">
          <span className="pull-left">{this.props.entity.label}</span>
          <span className="pull-right">Version: {this.props.entity.version}</span>
        </div>
        <div className="entity-information">
          <div className="entity-modal-image">
            <img src={MyMarketApi.getIcon(this.props.entity)} />
          </div>
          <div className="entity-content">
            <div className="entity-description">
              {this.props.entity.description}
            </div>
            <div className="entity-metadata">
              <div>Author</div>
              <span>
                <strong>
                  {this.props.entity.author}
                </strong>
              </span>
              <div>Company</div>
              <span>
                <strong>
                  {this.props.entity.org}
                </strong>
              </span>
              <div>Created</div>
              <span>
                <strong>
                  {(moment(this.props.entity.created * 1000)).format('MM-DD-YYYY HH:mm A')}
                </strong>
              </span>
              {this.props.entity.cdapVersion ? <div>CDAP Version</div> : null}
              {this.getVersion()}
            </div>
          </div>
        </div>
        <div className="actions-container">
          <div className="arrow-container text-center" onClick={this.fetchEntityDetail.bind(this)}>
            <span className="fa fa-angle-double-down"></span>
          </div>
          {
            this.state.showActions ?
              this.getActions()
            :
              null
          }
        </div>
        <AbstractWizard
          isOpen={this.state.wizard.actionIndex !== null && this.state.wizard.actionType !== null}
          onClose={this.closeWizard.bind(this)}
          wizardType={this.state.wizard.actionType}
          input={{action: this.state.wizard.action, package: this.props.entity}}
        />
      </Card>
    );
  }
}
MarketPlaceUsecaseEntity.propTypes = {
  className: PropTypes.string,
  entity: PropTypes.shape({
    name: PropTypes.string,
    version: PropTypes.string,
    label: PropTypes.string,
    author: PropTypes.string,
    description: PropTypes.string,
    org: PropTypes.string,
    created: PropTypes.number,
    cdapVersion: PropTypes.string
  })
};