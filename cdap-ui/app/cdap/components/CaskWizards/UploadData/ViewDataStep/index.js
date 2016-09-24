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
import React, { PropTypes } from 'react';
import { connect, Provider } from 'react-redux';
import UploadDataStore from 'services/WizardStores/UploadData/UploadDataStore';
import UploadDataActionCreator from 'services/WizardStores/UploadData/ActionCreator';
require('./ViewDataStep.less');

const mapStateWithProps = (state) => {
  return {
    value: state.viewdata.data,
    isLoading: state.viewdata.loading
  };
};

let DataTextArea = ({value, isLoading}) => {
  value = value.substring(0, 10000);
  return (
    <div className="view-data-step">
      {
        isLoading ?
          <div className="loading text-center"><i className="fa fa-spin fa-refresh" /></div>
          :
          <pre>
            {value}
          </pre>
      }
    </div>
  );
};

DataTextArea.propTypes = {
  value: PropTypes.string,
  isLoading: PropTypes.bool
};

DataTextArea = connect(
  mapStateWithProps,
  null
)(DataTextArea);

export default function ViewDataStep() {
  let { filename, packagename, packageversion, data } = UploadDataStore.getState().viewdata;

  if (!data) {
    UploadDataActionCreator
      .fetchDefaultData({ filename, packagename, packageversion });
  }

  return (
    <Provider store={UploadDataStore}>
      <DataTextArea />
    </Provider>
  );
}