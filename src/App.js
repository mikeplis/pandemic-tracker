import React, { Component } from 'react';
import { gql, graphql, compose } from 'react-apollo';
import { Route } from 'react-router-dom';
import Form from 'react-jsonschema-form';
import update from 'immutability-helper';
import { LinkContainer } from 'react-router-bootstrap';
import { Table, Navbar, Nav, NavItem } from 'react-bootstrap';

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
const MyNav = () =>
    <Navbar>
        <Nav>
            <LinkContainer to="/" exact={true}>
                <NavItem>Home</NavItem>
            </LinkContainer>
            <LinkContainer to="/create">
                <NavItem>Create</NavItem>
            </LinkContainer>
        </Nav>
    </Navbar>;

const Layout = ({ children }) =>
    <div>
        <MyNav />
        {children}
    </div>;

const Home = graphql(allGames)(({ data: { allGames } }) => {
    if (!allGames) {
        return null;
    }
    return (
        <Layout>
            <Table condensed>
                <thead>
                    <tr>
                        <th>Difficulty</th>
                        <th>Date</th>
                        <th>Roles</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    {allGames.map(({ didWin, difficulty, createdAt, roles, notes }) =>
                        <tr className={didWin ? 'success' : 'danger'}>
                            <td>
                                {difficulty}
                            </td>
                            <td>
                                {new Date(createdAt).toDateString()}
                            </td>
                            <td>
                                {roles.map(role => role.name).join(',')}
                            </td>
                            <td>
                                {notes}
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
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
                <Route exact path="/create" component={Create} />
            </div>
        );
    }
}

export default graphql(allGames)(App);
