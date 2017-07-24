import React, { Component } from 'react';
import { gql, graphql, compose } from 'react-apollo';
import { Route } from 'react-router-dom';
import Form from 'react-jsonschema-form';
import update from 'immutability-helper';
import ReactTable from 'react-table';
import { LinkContainer } from 'react-router-bootstrap';
import { Navbar, Nav, NavItem } from 'react-bootstrap';

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

const columns = [
    { Header: 'Result', id: 'result', accessor: d => (d.didWin ? 'Victory' : 'Default') },
    { Header: 'Difficulty', accessor: 'difficulty' },
    { Header: 'Date', id: 'date', accessor: d => new Date(d.createdAt).toDateString() },
    { Header: 'Roles', id: 'roles', accessor: d => d.roles.map(role => role.name).join(',') },
    { Header: 'Notes', accessor: 'notes' }
];

const TableComponent = ({ children, className, ...rest }) =>
    // <table className={'rt-table table ' + className} {...rest}>
    <table className={'table ' + className} {...rest}>
        {children}
    </table>;

const TheadComponent = ({ children, className, ...rest }) =>
    // <thead className={'rt-thead ' + className} {...rest}>
    <thead className={className} {...rest}>
        {children}
    </thead>;

const TbodyComponent = ({ children, className, ...rest }) =>
    // <tbody className={'rt-tbody ' + className} {...rest}>
    <tbody className={className} {...rest}>
        {children}
    </tbody>;

const TrGroupComponent = ({ children, className, ...rest }) => {
    const firstChild = React.Children.toArray(children)[0];
    return React.cloneElement(firstChild);
};

const TrComponent = ({ children, className, ...rest }) =>
    // <tr className={'rt-tr ' + className} {...rest}>
    <tr className={className} {...rest}>
        {children}
    </tr>;

const ThComponent = ({ toggleSort, className, children, ...rest }) => {
    return (
        <th
            // className={'rt-th ' + className}
            className={className}
            onClick={e => {
                toggleSort && toggleSort(e);
            }}
            {...rest}
        >
            {children}
        </th>
    );
};
const TdComponent = ({ children, className, ...rest }) =>
    // <td className={'rt-td ' + className} {...rest}>
    <td className={className} {...rest}>
        {children}
    </td>;

const Home = graphql(allGames)(({ data: { allGames } }) => {
    if (!allGames) {
        return null;
    }
    return (
        <Layout>
            <ReactTable
                data={allGames}
                columns={columns}
                minRows={0}
                showPagination={false}
                TableComponent={TableComponent}
                TheadComponent={TheadComponent}
                TbodyComponent={TbodyComponent}
                TrComponent={TrComponent}
                TdComponent={TdComponent}
                TrGroupComponent={TrGroupComponent}
                ThComponent={ThComponent}
            />
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
