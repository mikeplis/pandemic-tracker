import React, { Component } from 'react';
import { gql, graphql, compose } from 'react-apollo';
import { Route, Link } from 'react-router-dom';
import Form from 'react-jsonschema-form';

const schema = {
    title: 'Create Game',
    type: 'object',
    required: ['victory', 'difficulty', 'roles'],
    properties: {
        victory: { type: 'boolean', title: 'Victory?', default: false },
        difficulty: {
            type: 'string',
            title: 'Difficulty',
            enum: ['Introductory', 'Normal', 'Heroic'],
            default: 'Normal'
        },
        roles: {
            type: 'array',
            title: 'Roles',
            items: {
                type: 'string',
                enum: [], // filled in at runtime
                enumNames: [] // filled in at runtime
            }
        },
        notes: {
            type: 'string',
            title: 'Notes'
        }
    }
};

const uiSchema = {
    roles: {
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
    allRoles.forEach(({ id, name }) => {
        console.log(id, name);
        schema.properties.roles.items.enum.push(id);
        schema.properties.roles.items.enumNames.push(name);
    });
    return (
        <Layout>
            <Form schema={schema} uiSchema={uiSchema} />
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
