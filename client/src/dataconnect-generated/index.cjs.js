const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'client',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const listAllCategoriesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAllCategories');
}
listAllCategoriesRef.operationName = 'ListAllCategories';
exports.listAllCategoriesRef = listAllCategoriesRef;

exports.listAllCategories = function listAllCategories(dc) {
  return executeQuery(listAllCategoriesRef(dc));
};

const getReportsByAuthorRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetReportsByAuthor', inputVars);
}
getReportsByAuthorRef.operationName = 'GetReportsByAuthor';
exports.getReportsByAuthorRef = getReportsByAuthorRef;

exports.getReportsByAuthor = function getReportsByAuthor(dcOrVars, vars) {
  return executeQuery(getReportsByAuthorRef(dcOrVars, vars));
};

const createNewReportRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateNewReport', inputVars);
}
createNewReportRef.operationName = 'CreateNewReport';
exports.createNewReportRef = createNewReportRef;

exports.createNewReport = function createNewReport(dcOrVars, vars) {
  return executeMutation(createNewReportRef(dcOrVars, vars));
};

const updateReportStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateReportStatus', inputVars);
}
updateReportStatusRef.operationName = 'UpdateReportStatus';
exports.updateReportStatusRef = updateReportStatusRef;

exports.updateReportStatus = function updateReportStatus(dcOrVars, vars) {
  return executeMutation(updateReportStatusRef(dcOrVars, vars));
};
