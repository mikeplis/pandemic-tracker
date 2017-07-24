import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { ApolloProvider, ApolloClient, createNetworkInterface } from 'react-apollo';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootswatch/sandstone/bootstrap.css';
// import 'react-table/react-table.css';

import App from './App';
import registerServiceWorker from './registerServiceWorker';
import './index.css';

const client = new ApolloClient({
    networkInterface: createNetworkInterface({
        uri: 'https://api.graph.cool/simple/v1/cj5g5h96wyx10012201iw1agn'
    })
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
