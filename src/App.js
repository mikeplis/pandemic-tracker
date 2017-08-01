import React, { Component } from 'react';
import { gql, graphql, compose, withApollo } from 'react-apollo';
import { Route } from 'react-router-dom';
import Form from 'react-jsonschema-form';
import update from 'immutability-helper';
import { LinkContainer } from 'react-router-bootstrap';
import { Table, Navbar, Nav, NavItem } from 'react-bootstrap';
import { VictoryPie, VictoryTheme } from 'victory';

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
        'ui:widget': 'textarea',
        'ui:placeholder': 'Notes'
    }
};

const allGames = gql`
    {
        allGames(orderBy: createdAt_DESC) {
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
    mutation createGame(
        $didWin: Boolean!
        $difficulty: GAME_DIFFICULTY!
        $roleIds: [ID!]
        $notes: String
    ) {
        createGame(
            didWin: $didWin
            difficulty: $difficulty
            rolesIds: $roleIds
            notes: $notes
        ) {
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

const MyNav = () =>
    <Navbar>
        <Nav>
            <LinkContainer to="/" exact={true}>
                <NavItem>Home</NavItem>
            </LinkContainer>
            <LinkContainer to="/create">
                <NavItem>Create</NavItem>
            </LinkContainer>
            <LinkContainer to="/stats">
                <NavItem>Stats</NavItem>
            </LinkContainer>
        </Nav>
        <Nav pullRight style={{ marginRight: 15 }}>
            <LinkContainer to="/login">
                <NavItem>Login</NavItem>
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
                    {allGames.map(
                        ({ id, didWin, difficulty, createdAt, roles, notes }) =>
                            <tr
                                key={id}
                                className={didWin ? 'success' : 'danger'}
                            >
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

const Create = compose(
    graphql(createGame),
    graphql(allRoles)
)(({ mutate, data: { allRoles } }) => {
    const schema = update(baseSchema, {
        properties: {
            roleIds: {
                items: {
                    enum: {
                        $push: !allRoles ? [] : allRoles.map(({ id }) => id)
                    },
                    enumNames: {
                        $push: !allRoles ? [] : allRoles.map(({ name }) => name)
                    }
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

const Login = () =>
    <Layout>
        <div>Login</div>
    </Layout>;

const Stats = graphql(allGames)(({ data: { allGames } }) => {
    return (
        <Layout>
            {allGames &&
                <div>
                    <div>
                        <h3>Number of games</h3>
                        <div>
                            {allGames.length}
                        </div>
                    </div>
                    <div>
                        <h3>Win rate</h3>
                        <div>
                            {allGames.reduce(
                                (wins, { didWin }) =>
                                    didWin ? wins + 1 : wins,
                                0
                            ) / allGames.length}
                        </div>
                    </div>
                    <div>
                        <h3>Pie Chart</h3>
                        <div style={{ width: 300 }}>
                            <VictoryPie theme={VictoryTheme.material} />
                        </div>
                    </div>
                </div>}
        </Layout>
    );
});

class App extends Component {
    render() {
        const { client } = this.props;
        client.query({ query: allGames });
        client.query({ query: allRoles });
        return (
            <div className="container">
                <Route exact path="/" component={Home} />
                <Route exact path="/create" component={Create} />
                <Route exact path="/login" component={Login} />
                <Route exact path="/stats" component={Stats} />
            </div>
        );
    }
}

export default withApollo(App);
