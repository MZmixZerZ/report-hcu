# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListAllCategories*](#listallcategories)
  - [*GetReportsByAuthor*](#getreportsbyauthor)
- [**Mutations**](#mutations)
  - [*CreateNewReport*](#createnewreport)
  - [*UpdateReportStatus*](#updatereportstatus)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListAllCategories
You can execute the `ListAllCategories` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listAllCategories(): QueryPromise<ListAllCategoriesData, undefined>;

interface ListAllCategoriesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllCategoriesData, undefined>;
}
export const listAllCategoriesRef: ListAllCategoriesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listAllCategories(dc: DataConnect): QueryPromise<ListAllCategoriesData, undefined>;

interface ListAllCategoriesRef {
  ...
  (dc: DataConnect): QueryRef<ListAllCategoriesData, undefined>;
}
export const listAllCategoriesRef: ListAllCategoriesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listAllCategoriesRef:
```typescript
const name = listAllCategoriesRef.operationName;
console.log(name);
```

### Variables
The `ListAllCategories` query has no variables.
### Return Type
Recall that executing the `ListAllCategories` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListAllCategoriesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListAllCategoriesData {
  categories: ({
    id: UUIDString;
    name: string;
    description?: string | null;
  } & Category_Key)[];
}
```
### Using `ListAllCategories`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listAllCategories } from '@dataconnect/generated';


// Call the `listAllCategories()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listAllCategories();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listAllCategories(dataConnect);

console.log(data.categories);

// Or, you can use the `Promise` API.
listAllCategories().then((response) => {
  const data = response.data;
  console.log(data.categories);
});
```

### Using `ListAllCategories`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listAllCategoriesRef } from '@dataconnect/generated';


// Call the `listAllCategoriesRef()` function to get a reference to the query.
const ref = listAllCategoriesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listAllCategoriesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.categories);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.categories);
});
```

## GetReportsByAuthor
You can execute the `GetReportsByAuthor` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getReportsByAuthor(vars: GetReportsByAuthorVariables): QueryPromise<GetReportsByAuthorData, GetReportsByAuthorVariables>;

interface GetReportsByAuthorRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetReportsByAuthorVariables): QueryRef<GetReportsByAuthorData, GetReportsByAuthorVariables>;
}
export const getReportsByAuthorRef: GetReportsByAuthorRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getReportsByAuthor(dc: DataConnect, vars: GetReportsByAuthorVariables): QueryPromise<GetReportsByAuthorData, GetReportsByAuthorVariables>;

interface GetReportsByAuthorRef {
  ...
  (dc: DataConnect, vars: GetReportsByAuthorVariables): QueryRef<GetReportsByAuthorData, GetReportsByAuthorVariables>;
}
export const getReportsByAuthorRef: GetReportsByAuthorRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getReportsByAuthorRef:
```typescript
const name = getReportsByAuthorRef.operationName;
console.log(name);
```

### Variables
The `GetReportsByAuthor` query requires an argument of type `GetReportsByAuthorVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetReportsByAuthorVariables {
  authorId: UUIDString;
}
```
### Return Type
Recall that executing the `GetReportsByAuthor` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetReportsByAuthorData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetReportsByAuthorData {
  reports: ({
    id: UUIDString;
    title: string;
    description: string;
    status: string;
    dueDate?: DateString | null;
    category?: {
      name: string;
    };
  } & Report_Key)[];
}
```
### Using `GetReportsByAuthor`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getReportsByAuthor, GetReportsByAuthorVariables } from '@dataconnect/generated';

// The `GetReportsByAuthor` query requires an argument of type `GetReportsByAuthorVariables`:
const getReportsByAuthorVars: GetReportsByAuthorVariables = {
  authorId: ..., 
};

// Call the `getReportsByAuthor()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getReportsByAuthor(getReportsByAuthorVars);
// Variables can be defined inline as well.
const { data } = await getReportsByAuthor({ authorId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getReportsByAuthor(dataConnect, getReportsByAuthorVars);

console.log(data.reports);

// Or, you can use the `Promise` API.
getReportsByAuthor(getReportsByAuthorVars).then((response) => {
  const data = response.data;
  console.log(data.reports);
});
```

### Using `GetReportsByAuthor`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getReportsByAuthorRef, GetReportsByAuthorVariables } from '@dataconnect/generated';

// The `GetReportsByAuthor` query requires an argument of type `GetReportsByAuthorVariables`:
const getReportsByAuthorVars: GetReportsByAuthorVariables = {
  authorId: ..., 
};

// Call the `getReportsByAuthorRef()` function to get a reference to the query.
const ref = getReportsByAuthorRef(getReportsByAuthorVars);
// Variables can be defined inline as well.
const ref = getReportsByAuthorRef({ authorId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getReportsByAuthorRef(dataConnect, getReportsByAuthorVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.reports);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.reports);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateNewReport
You can execute the `CreateNewReport` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createNewReport(vars: CreateNewReportVariables): MutationPromise<CreateNewReportData, CreateNewReportVariables>;

interface CreateNewReportRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateNewReportVariables): MutationRef<CreateNewReportData, CreateNewReportVariables>;
}
export const createNewReportRef: CreateNewReportRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createNewReport(dc: DataConnect, vars: CreateNewReportVariables): MutationPromise<CreateNewReportData, CreateNewReportVariables>;

interface CreateNewReportRef {
  ...
  (dc: DataConnect, vars: CreateNewReportVariables): MutationRef<CreateNewReportData, CreateNewReportVariables>;
}
export const createNewReportRef: CreateNewReportRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createNewReportRef:
```typescript
const name = createNewReportRef.operationName;
console.log(name);
```

### Variables
The `CreateNewReport` mutation requires an argument of type `CreateNewReportVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateNewReportVariables {
  title: string;
  description: string;
  status: string;
  categoryId: UUIDString;
  dueDate?: DateString | null;
}
```
### Return Type
Recall that executing the `CreateNewReport` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateNewReportData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateNewReportData {
  report_insert: Report_Key;
}
```
### Using `CreateNewReport`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createNewReport, CreateNewReportVariables } from '@dataconnect/generated';

// The `CreateNewReport` mutation requires an argument of type `CreateNewReportVariables`:
const createNewReportVars: CreateNewReportVariables = {
  title: ..., 
  description: ..., 
  status: ..., 
  categoryId: ..., 
  dueDate: ..., // optional
};

// Call the `createNewReport()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createNewReport(createNewReportVars);
// Variables can be defined inline as well.
const { data } = await createNewReport({ title: ..., description: ..., status: ..., categoryId: ..., dueDate: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createNewReport(dataConnect, createNewReportVars);

console.log(data.report_insert);

// Or, you can use the `Promise` API.
createNewReport(createNewReportVars).then((response) => {
  const data = response.data;
  console.log(data.report_insert);
});
```

### Using `CreateNewReport`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createNewReportRef, CreateNewReportVariables } from '@dataconnect/generated';

// The `CreateNewReport` mutation requires an argument of type `CreateNewReportVariables`:
const createNewReportVars: CreateNewReportVariables = {
  title: ..., 
  description: ..., 
  status: ..., 
  categoryId: ..., 
  dueDate: ..., // optional
};

// Call the `createNewReportRef()` function to get a reference to the mutation.
const ref = createNewReportRef(createNewReportVars);
// Variables can be defined inline as well.
const ref = createNewReportRef({ title: ..., description: ..., status: ..., categoryId: ..., dueDate: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createNewReportRef(dataConnect, createNewReportVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.report_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.report_insert);
});
```

## UpdateReportStatus
You can execute the `UpdateReportStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateReportStatus(vars: UpdateReportStatusVariables): MutationPromise<UpdateReportStatusData, UpdateReportStatusVariables>;

interface UpdateReportStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateReportStatusVariables): MutationRef<UpdateReportStatusData, UpdateReportStatusVariables>;
}
export const updateReportStatusRef: UpdateReportStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateReportStatus(dc: DataConnect, vars: UpdateReportStatusVariables): MutationPromise<UpdateReportStatusData, UpdateReportStatusVariables>;

interface UpdateReportStatusRef {
  ...
  (dc: DataConnect, vars: UpdateReportStatusVariables): MutationRef<UpdateReportStatusData, UpdateReportStatusVariables>;
}
export const updateReportStatusRef: UpdateReportStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateReportStatusRef:
```typescript
const name = updateReportStatusRef.operationName;
console.log(name);
```

### Variables
The `UpdateReportStatus` mutation requires an argument of type `UpdateReportStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateReportStatusVariables {
  reportId: UUIDString;
  newStatus: string;
}
```
### Return Type
Recall that executing the `UpdateReportStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateReportStatusData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateReportStatusData {
  report_update?: Report_Key | null;
}
```
### Using `UpdateReportStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateReportStatus, UpdateReportStatusVariables } from '@dataconnect/generated';

// The `UpdateReportStatus` mutation requires an argument of type `UpdateReportStatusVariables`:
const updateReportStatusVars: UpdateReportStatusVariables = {
  reportId: ..., 
  newStatus: ..., 
};

// Call the `updateReportStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateReportStatus(updateReportStatusVars);
// Variables can be defined inline as well.
const { data } = await updateReportStatus({ reportId: ..., newStatus: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateReportStatus(dataConnect, updateReportStatusVars);

console.log(data.report_update);

// Or, you can use the `Promise` API.
updateReportStatus(updateReportStatusVars).then((response) => {
  const data = response.data;
  console.log(data.report_update);
});
```

### Using `UpdateReportStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateReportStatusRef, UpdateReportStatusVariables } from '@dataconnect/generated';

// The `UpdateReportStatus` mutation requires an argument of type `UpdateReportStatusVariables`:
const updateReportStatusVars: UpdateReportStatusVariables = {
  reportId: ..., 
  newStatus: ..., 
};

// Call the `updateReportStatusRef()` function to get a reference to the mutation.
const ref = updateReportStatusRef(updateReportStatusVars);
// Variables can be defined inline as well.
const ref = updateReportStatusRef({ reportId: ..., newStatus: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateReportStatusRef(dataConnect, updateReportStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.report_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.report_update);
});
```

