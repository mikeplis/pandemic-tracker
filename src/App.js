import React, { Component } from 'react';
import { gql, graphql, compose } from 'react-apollo';
import { Route, Link } from 'react-router-dom';
import Form from 'react-jsonschema-form';
import update from 'immutability-helper';
import ReactTable from 'react-table';

const baseSchema = {
    title: 'Create Game',
    type: 'object',
    required: ['didWin', 'difficulty', 'roleIds'],
    properties: {
        didWin: { type: 'boolean', title: 'Victory?', default: false },
        difficulty: {
            type: 'string',
            title: 'Difficulty',
            enum: ['Introductory', 'Normal', 'Heroic'],
            default: 'Normal'
        },
        roleIds: {
            type: 'array',
            title: 'Roles',
            items: {
                type: 'string',
                enum: [], // filled in at runtime
                enumNames: [] // filled in at runtime
            },
            uniqueItems: true
        },
        notes: {
            type: 'string',
            title: 'Notes'
        }
    }
};

const uiSchema = {
    roleIds: {
        'ui:widget': 'checkboxes'
    },
    notes: {
        'ui:widget': 'textarea'
    }
};

const allGames = gql`
    {
        allGames(orderBy: createdAt_ASC) {
            id
            didWin
            difficulty
            createdAt
            roles {
                id
                name
            }
            notes
        }
    }
`;

const createGame = gql`
    mutation createGame($didWin: Boolean!, $difficulty: GAME_DIFFICULTY!, $roleIds: [ID!], $notes: String) {
        createGame(didWin: $didWin, difficulty: $difficulty, rolesIds: $roleIds, notes: $notes) {
            id
        }
    }
`;

const allRoles = gql`
    {
        allRoles(orderBy: name_ASC) {
            id
            name
        }
    }
`;

// TODO: need additional library to get react-router and react-bootstrap to play nice
const Nav = () =>
    <ul>
        <li>
            <Link to="/">Home</Link>
        </li>
        <li>
            <Link to="/create">Create</Link>
        </li>
    </ul>;

const Layout = ({ children }) =>
    <div>
        <Nav />
        {children}
    </div>;

const columns = [
    { Header: 'Result', id: 'result', accessor: d => (d.didWin ? 'Victory' : 'Default') },
    { Header: 'Difficulty', accessor: 'difficulty' },
    { Header: 'Date', id: 'date', accessor: d => new Date(d.createdAt).toDateString() },
    { Header: 'Roles', id: 'roles', accessor: d => d.roles.map(role => role.name).join(',') },
    { Header: 'Notes', accessor: 'notes' }
];

const Home = graphql(allGames)(({ data: { allGames } }) => {
    if (!allGames) {
        return null;
    }
    return (
        <Layout>
            <ReactTable data={allGames} columns={columns} pageSize={10} showPagination={false} />
        </Layout>
    );
});

const Create = compose(graphql(createGame), graphql(allRoles))(({ mutate, data: { allRoles, loading } }) => {
    if (loading) {
        return null;
    }
    const schema = update(baseSchema, {
        properties: {
            roleIds: {
                items: {
                    enum: { $push: allRoles.map(({ id }) => id) },
                    enumNames: { $push: allRoles.map(({ name }) => name) }
                }
            }
        }
    });
    return (
        <Layout>
            <Form
                schema={schema}
                uiSchema={uiSchema}
                onSubmit={({ formData }) => {
                    mutate({
                        variables: formData, // this works because formData fields match variable names in GraphQL query
                        refetchQueries: [{ query: allGames }]
                    });
                }}
                noHtml5Validate={true}
            />
        </Layout>
    );
});

class App extends Component {
    render() {
        return (
            <div className="container">
                <Route exact path="/" component={Home} />
                <Route path="/create" component={Create} />
            </div>
        );
    }
}

export default graphql(allGames)(App);
