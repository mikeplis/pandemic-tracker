import React, { Component } from 'react';
import { gql, graphql, compose } from 'react-apollo';
import { Route, Link } from 'react-router-dom';
import {
    Button,
    FormGroup,
    ControlLabel,
    FormControl,
    Checkbox
} from 'react-bootstrap';

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
        }
    }
`;

const createGame = gql`
    mutation createGame(
        $didWin: Boolean!
        $difficulty: GAME_DIFFICULTY!
        $roleIds: [ID!]
    ) {
        createGame(
            didWin: $didWin
            difficulty: $difficulty
            rolesIds: $roleIds
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

const Home = graphql(allGames)(({ data: { allGames } }) => {
    if (!allGames) {
        return null;
    }
    return (
        <Layout>
            <ul>
                {allGames.map(
                    ({ id, didWin, difficulty, createdAt, roles }) => {
                        return (
                            <li key={id}>
                                <ul>
                                    <li>{`Result - ${didWin
                                        ? 'Victory'
                                        : 'Defeat'}`}</li>
                                    <li>{`Difficulty - ${difficulty}`}</li>
                                    <li>{`Date - ${createdAt}`}</li>
                                    <li>
                                        <ul>
                                            {roles.map(({ id, name }) => {
                                                return (
                                                    <li key={id}>
                                                        {name}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </li>
                                </ul>
                            </li>
                        );
                    }
                )}
            </ul>
        </Layout>
    );
});

const Create = compose(
    graphql(createGame),
    graphql(allRoles)
)(({ mutate, data: { allRoles, loading } }) => {
    if (loading) {
        return null;
    }
    console.log(this);
    return (
        <Layout>
            <h1>Create</h1>
            <form>
                <FormGroup>
                    <Checkbox inputRef={ref => (this.victoryRef = ref)}>
                        Victory
                    </Checkbox>
                </FormGroup>
                <FormGroup>
                    <ControlLabel>Difficulty</ControlLabel>
                    <FormControl
                        inputRef={ref => (this.difficultyRef = ref)}
                        componentClass="select"
                    >
                        {['Introductory', 'Normal', 'Heroic'].map(name =>
                            <option key={name} value={name}>
                                {name}
                            </option>
                        )}
                    </FormControl>
                </FormGroup>
                <FormGroup>
                    <ControlLabel>Roles</ControlLabel>
                    <FormControl
                        inputRef={ref => (this.rolesRef = ref)}
                        componentClass="select"
                        multiple
                    >
                        {allRoles &&
                            allRoles.map(({ id, name }) =>
                                <option key={id} value={id}>
                                    {name}
                                </option>
                            )}
                    </FormControl>
                </FormGroup>
                <FormGroup>
                    <ControlLabel>Notes</ControlLabel>
                    <FormControl
                        type="text"
                        placeholder="Notes"
                        inputRef={ref => (this.notesRef = ref)}
                    />
                </FormGroup>
                <Button
                    onClick={() =>
                        mutate({
                            variables: {
                                didWin: true,
                                difficulty: 'Introductory'
                            },
                            refetchQueries: [
                                {
                                    query: allGames
                                }
                            ]
                        })}
                >
                    Create Game
                </Button>
            </form>
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
