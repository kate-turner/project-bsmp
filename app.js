const express = require("express");
const bodyParser = require("body-parser");
const graphQlHttp = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const Plan = require("./models/plan");

const app = express();

app.use(bodyParser.json());

app.use(
  "/graphql",
  graphQlHttp({
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
        // Plan constructor, use static methods from mongoose find() to find documents in that collection,
        // can use filter() as well
        // remember to return so graphql knows it's async
        return Plan.find()
          .then(plans => {
            // map through the plan data so we can eliminate the metadata
            return plans.map(plan => {
                // override id, because graphql does not understand, and second argument is a native method by mongoose which overrides this for us
              return { ...plan._doc, _id: plan.id };
            });
          })
          .catch(err => {
            throw err;
          });
      },
      createPlan: args => {
        // mutation - resolver - which pulls in Mongo Plan Model
        const plan = new Plan({
          title: args.planInput.title,
          description: args.planInput.description
        });

        // .save() is a mongoose provided function
        // create plan resolver, return plan so graphql knows this is an async operation and does not resolve pronto
        return plan
          .save()
          .then(result => {
            console.log(result);
            // return result without all the metadata provided by mongo
            return { ...result._doc, _id: plan.id };
          })
          .catch(err => {
            // throw err if saving to db does not work
            console.log(err);
            throw err;
          });
        return plan;
      }
    },
    graphiql: true
  })
);

app.get("/", (req, res, next) => {
  res.send("Up and rolling");
});

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-tdxnv.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });
