const express = require("express");
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

//server/index.js
const {
  client,
  createTables,
  createCustomer,
  createRestaurant,
  createReservation,
  fetchCustomers,
  fetchRestaurants,
  fetchReservations,
  destroyReservation,
} = require("./db");

const init = async () => {
  await client.connect();

  const response = await createTables();
  console.log("Created Tables");

  const [Max, Gryphon, Kalu, Hero, TCC, DJs, Ws] = await Promise.all([
    createCustomer({ name: "Max" }),
    createCustomer({ name: "Gryphon" }),
    createCustomer({ name: "Kalu" }),
    createCustomer({ name: "Hero" }),

    createRestaurant({ name: "Terra Cotta Cafe" }),
    createRestaurant({ name: "Don Juans" }),
    createRestaurant({ name: "Walters" }),
  ]);

  console.log(await fetchCustomers());
  console.log(await fetchRestaurants());

  const [reservation1, reservation2, reservation3] = await Promise.all([
    createReservation({
      customer_id: Max.id,
      restaurant_id: TCC.id,
      reservation_date: "08/20/2024",
      party_count: 3,
    }),
    createReservation({
      customer_id: Max.id,
      restaurant_id: DJs.id,
      reservation_date: "09/28/2024",
      party_count: 5,
    }),
    createReservation({
      customer_id: Hero.id,
      restaurant_id: Ws.id,
      reservation_date: "10/29/2024",
      party_count: 2,
    }),
  ]);

  console.log(await fetchReservations());

  await destroyReservation({
    id: reservation1.id,
    customer_id: reservation1.customer_id,
  });

  console.log(await fetchReservations());

  // needs to be after the DB create/Seed Calls
  app.listen(PORT, () => {
    console.log(`Hello from PORT ${PORT}`);
  });
};

init();

app.get("/api/customers", async (req, res, next) => {
  try {
    res.send(await fetchCustomers());
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/restaurants", async (req, res, next) => {
  try {
    res.send(await fetchRestaurants());
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/reservations", async (req, res, next) => {
  try {
    res.send(await fetchReservations());
  } catch (ex) {
    next(ex);
  }
});

app.delete(
  "/api/customers/:customer_id/reservations/:id",
  async (req, res, next) => {
    try {
      await destroyReservation({
        customer_id: req.params.customer_id,
        id: req.params.id,
      });
      res.sendStatus(204);
    } catch (ex) {
      next(ex);
    }
  }
);

app.post("/api/customers/:id/reservations", async (req, res, next) => {
  try {
    res.status(201).send(
      await createReservation({
        customer_id: req.params.id,
        restaurant_id: req.body.restaurant_id,
        reservation_date: req.body.reservation_date,
        party_count: req.body.party_count,
      })
    );
  } catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).send({ error: err.message || err });
});
