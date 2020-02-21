const express = require('express');
const bodyParser = require('body-parser');
const graphQlHttp = require('express-graphql');
const { buildSchema } = require('graphql');

const app = express();

const plans = [];

app.use(bodyParser.json());

app.use('/graphql', graphQlHttp({
    schema: buildSchema(`
        type Plan {
            _id: ID!,
            title: String!,
            description: String,
        }

        input PlanInput {
            title: String!
            description: String
        }

        type RootQuery {
            plans: [Plan!]!
        }

        type RootMutation {
            createPlan(planInput: PlanInput): Plan
        }

        schema {
            query:  RootQuery
            mutation:  RootMutation
        }
    `),
    rootValue: {
        plans: () => {
            return plans;
        },
        createPlan: (args) => {
            const plan = {
                _id: Math.random().toString(),
                title: args.planInput.title,
                description: args.planInput.description
            }
            console.log(args)
            plans.push(plan);
            return plan;
        }
    },
    graphiql: true
    })
)

app.get('/',  (req, res, next) => {
    res.send('Up and rolling')
})

app.listen(3000);