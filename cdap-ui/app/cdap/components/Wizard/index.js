/*
 * Copyright © 2016-2017 Cask Data, Inc.
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
import Rx from 'rx';
import findIndex from 'lodash/findIndex';
import first from 'lodash/head';
import shortid from 'shortid';
import isEmpty from 'lodash/isEmpty';
import WizardStepHeader from './WizardStepHeader';
import WizardStepContent from './WizardStepContent';
import CardActionFeedback from 'components/CardActionFeedback';
import IconSVG from 'components/IconSVG';
import classnames from 'classnames';
import ee from 'event-emitter';
import globalEvents from 'services/global-events';
import T from 'i18n-react';

require('./Wizard.scss');

const currentStepIndex = (arr, id) => {
  return findIndex(arr, (step) => id === step.id);
};
const canFinish = (id, wizardConfig) => {
  let stepIndex = currentStepIndex(wizardConfig.steps, id);
  let canFinish = true;
  for (var i = stepIndex + 1; i < wizardConfig.steps.length; i++) {
    let reqsFields = Array.isArray(wizardConfig.steps[i].requiredFields);
    canFinish = canFinish && (!reqsFields || (reqsFields && reqsFields.length === 0));
  }
  return canFinish;
};

export default class Wizard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeStep: this.props.wizardConfig.steps[0].id,
      loading: false,
      loadingCTA: false,
      error: '',
      requiredStepsCompleted: false,
      callToActionInfo: {}
    };

    this.handleCallToActionClick = this.handleCallToActionClick.bind(this);
    this.handleMainCallToActionClick = this.handleMainCallToActionClick.bind(this);
    this.eventEmitter = ee(ee);
  }
  componentWillMount() {
    this.checkRequiredSteps();
    this.storeSubscription = this.props.store.subscribe(() => {
      this.checkRequiredSteps();
    });
  }
  componentWillUnmount() {
    this.storeSubscription();
  }
  checkRequiredSteps() {
    let state = this.props.store.getState();
    let steps = Object.keys(state);

    // non-required steps are marked as complete by default
    let requiredStepsCompleted = steps.every(key => {
      return state[key].__complete;
    });
    if (this.state.requiredStepsCompleted != requiredStepsCompleted) {
      this.setState({
        requiredStepsCompleted
      });
    }
  }
  getChildContext() {
    return {
      activeStep: this.state.activeStep
    };
  }
  setActiveStep(stepId) {
    this.setState({
      activeStep: stepId
    });
  }
  goToNextStep(stepId) {
    let currentStep = findIndex(
      this.props.wizardConfig.steps,
      (step) => stepId === step.id
    );
    this.setActiveStep(this.props.wizardConfig.steps[currentStep + 1].id);
  }
  goToPreviousStep(stepId) {
    let currentStep = findIndex(
      this.props.wizardConfig.steps,
      (step) => stepId === step.id
    );
    this.setActiveStep(this.props.wizardConfig.steps[currentStep - 1].id);
  }
  submitForm() {
    let onSubmitReturn = this.props.onSubmit(this.props.store);
    this.setState({loading: true});
    if (onSubmitReturn instanceof Rx.Observable) {
      onSubmitReturn
      .subscribe(
        () => {
          this.setState({
            error: false,
            loading: false
          });
          if (this.props.successInfo && !isEmpty(this.props.successInfo)) {
            this.setState({callToActionInfo: this.props.successInfo});
          } else {
            this.props.onClose(true);
          }
        },
        (err) => {
          if (err) {
            this.setState({
              error: err,
              loading: false
            });
          }
        }
      );
    }
  }
  isStepComplete(stepId) {
    let state = this.props.store.getState()[stepId];
    return state && state.__complete;
  }

  handleCallToActionClick() {
    this.eventEmitter.emit(globalEvents.CLOSEMARKET);
  }

  handleMainCallToActionClick() {
    if (this.state.callToActionInfo.buttonOnClick) {
      this.setState({loadingCTA: true});
      let buttonClickReturn = this.state.callToActionInfo.buttonOnClick();
      if (buttonClickReturn instanceof Rx.Observable) {
        buttonClickReturn
        .subscribe(
          () => {
            this.setState({
              error: false,
              loadingCTA: false
            });
            this.handleCallToActionClick();
          },
          (err) => {
            this.setState({
              error: err,
              loadingCTA: false
            });
            this.handleCallToActionClick();
          }
        );
      }
    } else {
      this.handleCallToActionClick();
    }
  }

  getNavigationButtons(matchedStep) {
    let matchedIndex = currentStepIndex(this.props.wizardConfig.steps, matchedStep.id);
    let navButtons;
    let nextButton = (
      <button
        className="btn btn-secondary"
        onClick={this.goToNextStep.bind(this, matchedStep.id)}
      >
        <span>Next</span>
        <IconSVG name="icon-chevron-right" />
      </button>
    );
    let prevButton = (
      <button
        className="btn btn-secondary"
        onClick={this.goToPreviousStep.bind(this, matchedStep.id)}
      >
        <IconSVG name="icon-chevron-left" />
        <span>Previous</span>
      </button>
    );
    let finishButton = (
      <button
        className="btn btn-primary"
        onClick={this.submitForm.bind(this)}
        disabled={(!this.state.requiredStepsCompleted || this.state.loading) ? 'disabled' : null}
      >
        Finish
      </button>
    );
    // This is ugly. We need to find a better way.
    if (matchedIndex === 0 && this.props.wizardConfig.steps.length > 1) {
      navButtons = (
        <span>
          {canFinish(matchedStep.id, this.props.wizardConfig) ? finishButton : null}
          {nextButton}
        </span>
      );
    }
    if (matchedIndex === this.props.wizardConfig.steps.length - 1 && this.props.wizardConfig.steps.length > 1) {
      navButtons = (
        <span>
          {prevButton}
          {canFinish(matchedStep.id, this.props.wizardConfig) ? finishButton : null}
        </span>
      );
    }
    if (matchedIndex !== 0 &&
        matchedIndex !== this.props.wizardConfig.steps.length - 1 &&
        this.props.wizardConfig.steps.length > 1) {
      navButtons = (
        <span>
          {prevButton}
          {canFinish(matchedStep.id, this.props.wizardConfig) ? finishButton : null}
          {nextButton}
        </span>
      );
    }
    if (this.props.wizardConfig.steps.length === 1) {
      navButtons = (
        <span>
          {finishButton}
        </span>
      );
    }

    return navButtons;
  }

  getStepHeaders() {
    let stepHeaders = this.props
      .wizardConfig
      .steps
      .map( (step) => (
        <WizardStepHeader
          label={`${step.shorttitle}`}
          className={ this.isStepComplete(step.id) ? 'completed' : null}
          id={step.id}
          key={shortid.generate()}
          onClick={this.setActiveStep.bind(this, step.id)}
        />
      ));

    return stepHeaders;
  }

  getStepContent() {
    let stepContent = this.props
      .wizardConfig
      .steps
      .filter(step => step.id === this.state.activeStep)
      .map((matchedStep) => {
        return (
          <WizardStepContent
            title={matchedStep.title}
            description={matchedStep.description}
            stepsCount={this.props.wizardConfig.steps.length}
            currentStep={currentStepIndex(this.props.wizardConfig.steps, matchedStep.id) + 1}
          >
            {matchedStep.content}
            <div className="text-xs-right wizard-navigation">
              {this.getNavigationButtons(matchedStep)}
            </div>
          </WizardStepContent>
        );
      });

    stepContent = first(stepContent);
    return stepContent;
  }

  getCallsToAction() {
    let callToActionInfo = this.state.callToActionInfo;
    return (
      <div>
        <div
          className="close-section float-xs-right"
          onClick={this.props.onClose.bind(null, true)}
        >
          <IconSVG name="icon-close" />
        </div>
        <div className="result-container">
          <span
            className="success-message"
            title={callToActionInfo.message}
          >
            {callToActionInfo.message}
            <p>{callToActionInfo.subtitle}</p>
          </span>
          <div className="clearfix">
            <a
              href={callToActionInfo.buttonUrl}
              title={callToActionInfo.buttonLabel}
              className={classnames("call-to-action btn btn-primary", {"disabled": this.state.loadingCTA})}
              onClick={this.handleMainCallToActionClick}
            >
              {callToActionInfo.buttonLabel}
              {
                this.state.loadingCTA ?
                  <IconSVG
                    name="icon-spinner"
                    className="fa-spin"
                  />
                :
                  null
              }
            </a>
            {
              callToActionInfo.links ?
                (
                  callToActionInfo.links.map(link => {
                    return (
                      this.getCallToActionLink(link)
                    );
                  })
                )
              :
                this.getCallToActionLink(callToActionInfo)
            }
          </div>
        </div>
      </div>
    );
  }

  getCallToActionLink(link) {
    return (
      <a
        href={link.linkUrl}
        className="secondary-call-to-action text-white"
        onClick={this.handleCallToActionClick}
      >
        {link.linkLabel}
      </a>
    );
  }

  getWizardFooter() {
    let wizardFooter = null;
    if (!isEmpty(this.state.callToActionInfo)) {
      wizardFooter = this.getCallsToAction();
    }
    if (this.state.error) {
      let footertitle = this.props.wizardConfig.footertitle;
      let step;
      if (!footertitle) {
        step = T.translate(`features.Wizard.${this.props.wizardType}.headerlabel`);
      } else {
        step = footertitle;
      }
      wizardFooter = (
        <CardActionFeedback
          type='DANGER'
          message={T.translate('features.Wizard.FailedMessage', {step})}
          extendedMessage={this.state.error}
        />
      );
    }
    if (this.state.loading) {
      wizardFooter = (
        <CardActionFeedback
          type='LOADING'
          message="Loading"
        />
      );
    }
    return wizardFooter;
  }

  render() {
    return (
      <div className="cask-wizard">
        <div className="wizard-body">
          <div className="wizard-steps-header">
            {this.getStepHeaders()}
          </div>
          <div className="wizard-steps-content">
            {this.getStepContent()}
          </div>
        </div>
        <div className={classnames("wizard-footer", {success: !isEmpty(this.state.callToActionInfo)})}>
          {this.getWizardFooter()}
        </div>
      </div>
    );
  }
}

const wizardConfigType = PropTypes.shape({
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
      content: PropTypes.node,
      skipToComplete: PropTypes.bool
    })
  )
});

Wizard.childContextTypes = {
  activeStep: PropTypes.string
};
Wizard.propTypes = {
  wizardConfig: wizardConfigType.isRequired,
  wizardType: PropTypes.string,
  store: PropTypes.shape({
    getState: PropTypes.func,
    dispatch: PropTypes.func,
    subscribe: PropTypes.func,
    replaceReducer: PropTypes.func
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  successInfo: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};
