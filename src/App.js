import React, { Component } from 'react';
import { gql, graphql } from 'react-apollo';

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

class App extends Component {
    render() {
        const { allGames } = this.props.data;
        if (!allGames) {
            return null;
        }
        return (
            <div>
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
            </div>
        );
    }
}

export default graphql(allGames)(App);
