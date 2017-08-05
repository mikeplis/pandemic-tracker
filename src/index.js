import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import {
    ApolloProvider,
    ApolloClient,
    createNetworkInterface
} from 'react-apollo';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootswatch/flatly/bootstrap.css';
// import 'react-table/react-table.css';

import App from './App';
import registerServiceWorker from './registerServiceWorker';
import './index.css';

const networkInterface = createNetworkInterface({
    uri: 'https://api.graph.cool/simple/v1/cj5g5h96wyx10012201iw1agn'
});

networkInterface.use([
    {
        applyMiddleware(req, next) {
            if (!req.options.headers) {
                req.options.headers = {}; // Create the header object if needed.
            }
            // get the authentication token from local storage if it exists
            const token = localStorage.getItem('pandemicToken');
            req.options.headers.authorization = token
                ? `Bearer ${token}`
                : null;
            console.log(token, req.options.headers);
            next();
        }
    }
]);

const client = new ApolloClient({
    networkInterface
});

ReactDOM.render(
    <ApolloProvider client={client}>
        <Router>
            <App />
        </Router>
    </ApolloProvider>,
    document.getElementById('root')
);
registerServiceWorker();
