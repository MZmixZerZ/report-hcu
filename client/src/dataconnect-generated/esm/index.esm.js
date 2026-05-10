import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'client',
  location: 'us-east4'
};

export const listAllCategoriesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAllCategories');
}
listAllCategoriesRef.operationName = 'ListAllCategories';

export function listAllCategories(dc) {
  return executeQuery(listAllCategoriesRef(dc));
}

export const getReportsByAuthorRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetReportsByAuthor', inputVars);
}
getReportsByAuthorRef.operationName = 'GetReportsByAuthor';

export function getReportsByAuthor(dcOrVars, vars) {
  return executeQuery(getReportsByAuthorRef(dcOrVars, vars));
}

export const createNewReportRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateNewReport', inputVars);
}
createNewReportRef.operationName = 'CreateNewReport';

export function createNewReport(dcOrVars, vars) {
  return executeMutation(createNewReportRef(dcOrVars, vars));
}

export const updateReportStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateReportStatus', inputVars);
}
updateReportStatusRef.operationName = 'UpdateReportStatus';

export function updateReportStatus(dcOrVars, vars) {
  return executeMutation(updateReportStatusRef(dcOrVars, vars));
}

