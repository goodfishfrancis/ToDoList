//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");

const mongoose = require("mongoose");

const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

// link the css
app.use(express.static("public"));

// initialize connection and database: todoListDB
mongoose.connect("mongodb://localhost:27017/todoListDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});




// create schemas for documents
const itemsSchema = new mongoose.Schema({
  name: String
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});


// Create Mongoose Model
// NOTE: mongoose model identifiers' fist letter capitalized
const List = mongoose.model("List", listSchema);
const Item = mongoose.model("Item", itemsSchema);

// create some default items for todolist
const item1 = new Item({
  name: "Welcome to your todo list"
});

const item2 = new Item({
  name: "Click the + button to add a new item"
});

const item3 = new Item({
  name: "<------ Click this to delete an item"
});

// schemas
const defaultItems = [item1, item2, item3];

// Item.insertMany(defaultItems, function(err){
//   if(err){
//     console.log(err);
//   }
//   else{
//     console.log("Successfully inserted items into todoListDB.items");
//   }
// });

// API endpoint for homepage
app.get("/", function(req, res) {
  // look for items in Items collection
  Item.find({}, function(err, foundItems) {
    // if no items are found, insert default items
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Default items saved to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});

// endpoint called when user enters new item
// to todo list and clicks the "+" button
app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newItem = new Item({
    name: itemName
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne(
      {
        name: listName
      },
      function(err, foundList) {
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/" + listName);
      }
    );
  }
});

// endpoint called when user clicks checkbox next to item
// item id is captured and then used to delete item from db
app.post("/delete", function(req, res) {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;
  console.log(listName, checkedItemID);

  if (listName === "Today") {
    Item.findByIdAndDelete(checkedItemID, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log(
          "Successfully deleted item with id " + checkedItemID + " from db"
        );
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}},function(err, foundList) {
        if (!err) {
          console.log("Successfully removed item from collection!");
          res.redirect("/" + listName);
        } else {
          console.log(err);
        }
      }
    );
  }
});

// when user creates custom list via url params
app.get("/:listName", function(req, res) {
  const listName = _.capitalize(req.params.listName);

  List.findOne({name: listName}, function(err, foundList) {
      if (err) {
        console.log(err);
      } else {
        if (foundList) {
          res.render("list", {
            listTitle: foundList.name,
            newListItems: foundList.items
          });
        } else {
          const list = new List({
            name: listName,
            items: defaultItems
          });
          list.save();
          res.redirect("/" + listName);
        }
      }
    }
  );
});

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
