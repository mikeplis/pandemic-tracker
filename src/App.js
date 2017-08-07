import React, { Component } from 'react';
import { gql, graphql, compose, withApollo } from 'react-apollo';
import { Route, Redirect } from 'react-router-dom';
import Form from 'react-jsonschema-form';
import update from 'immutability-helper';
import { LinkContainer } from 'react-router-bootstrap';
import { Table, Navbar, Nav, NavItem } from 'react-bootstrap';
import { VictoryPie, VictoryTheme, VictoryBar, VictoryChart } from 'victory';
import {
    flow,
    groupBy,
    map,
    entries,
    sortBy,
    flatMap,
    words,
    join
} from 'lodash/fp';

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
        {/* <Nav pullRight>
            <LinkContainer to="/login">
                <NavItem>Login</NavItem>
            </LinkContainer>
        </Nav> */}
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

const loginSchema = {
    type: 'object',
    required: ['email', 'password'],
    properties: {
        email: {
            title: 'Email',
            type: 'string'
        },
        password: {
            title: 'Password',
            type: 'string'
        }
    }
};

const loginUiSchema = {
    email: {
        'ui:widget': 'email'
    },
    password: {
        'ui:widget': 'password'
    }
};

const signinUser = gql`
    mutation signinUser($email: String!, $password: String!) {
        signinUser(email: { email: $email, password: $password }) {
            token
        }
    }
`;

const Login = graphql(signinUser)(({ mutate }) =>
    <Layout>
        <Form
            onSubmit={({ formData }) =>
                mutate({ variables: formData })
                    .then(({ data: { signinUser: { token } } }) =>
                        localStorage.setItem('pandemicToken', token)
                    )
                    .catch(error => console.log('error', error))}
            schema={loginSchema}
            uiSchema={loginUiSchema}
        />
    </Layout>
);

const Stats = graphql(allGames)(({ data: { allGames } }) => {
    const winRate =
        allGames &&
        allGames.reduce((wins, { didWin }) => (didWin ? wins + 1 : wins), 0) /
            allGames.length;
    const gamesByDifficultyData = flow(
        groupBy('difficulty'),
        entries,
        map(([difficulty, games]) => ({ x: difficulty, y: games.length }))
    )(allGames);
    const winRateByDifficultyData = flow(
        groupBy('difficulty'),
        entries,
        sortBy(([difficulty]) =>
            ['Introductory', 'Normal', 'Heroic'].indexOf(difficulty)
        ),
        map(([difficulty, games]) => ({
            x: difficulty,
            y:
                games.reduce(
                    (wins, { didWin }) => (didWin ? wins + 1 : wins),
                    0
                ) / games.length
        }))
    )(allGames);
    const gamesByRoleData = flow(
        flatMap(game => map(role => [role.name, game])(game.roles)),
        groupBy(pair => pair[0]), // groupBy role name
        entries,
        sortBy(([roleName]) => roleName),
        // map(([roleName, games]) => ({ x: roleName, y: games.length })) // NOTE: this is the same function as in gamesByDifficultyData
        map(([roleName, games]) => ({
            x: flow(words, map(role => role[0]), join(''))(roleName),
            y: games.length
        })) // I shouldn't have to format 'x' like that, but I couldn't figure out how to do it in Victory
    )(allGames);
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
                            {winRate.toFixed(2) * 100 + '%'}
                        </div>
                    </div>
                    <div>
                        <h3>Games By Difficulty</h3>
                        <div style={{ width: 300 }}>
                            <VictoryPie
                                theme={VictoryTheme.material}
                                data={gamesByDifficultyData}
                                colorScale="cool"
                            />
                        </div>
                    </div>
                    <div>
                        <h3>Win rate by difficulty</h3>
                        <div style={{ width: 300 }}>
                            <VictoryChart
                                domainPadding={30}
                                theme={VictoryTheme.material}
                            >
                                <VictoryBar
                                    theme={VictoryTheme.material}
                                    data={winRateByDifficultyData}
                                />
                            </VictoryChart>
                        </div>
                    </div>
                    <div>
                        <h3>Games by role</h3>
                        <div style={{ width: 300 }}>
                            <VictoryChart
                                domainPadding={10}
                                theme={VictoryTheme.material}
                            >
                                <VictoryBar
                                    theme={VictoryTheme.material}
                                    data={gamesByRoleData}
                                />
                            </VictoryChart>
                        </div>
                    </div>
                </div>}
        </Layout>
    );
});

const PrivateRoute = ({ component: Component, ...rest }) =>
    <Route
        {...rest}
        render={props =>
            localStorage.getItem('pandemicToken')
                ? <Component {...props} />
                : <Redirect
                      to={{
                          pathname: '/login',
                          state: { from: props.location }
                      }}
                  />}
    />;

class App extends Component {
    render() {
        const { client } = this.props;
        // prefetch some queries
        client.query({ query: allGames });
        client.query({ query: allRoles });
        return (
            <div className="container-fluid">
                <PrivateRoute exact path="/" component={Home} />
                <PrivateRoute path="/create" component={Create} />
                <Route path="/login" component={Login} />
                <PrivateRoute path="/stats" component={Stats} />
            </div>
        );
    }
}

export default withApollo(App);
