const mysql = require("mysql");
const inquirer = require("inquirer");
var numItems = 0;
var orderquantity;
var storequnatity;
var user_id;
var compared = false;

// create a link to the SQL database
const connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "bamazon"
});

connection.connect(function(err){
    if(err) throw err;
    console.log("connected as id " + connection.threadId + "\n");
    database("read", "products", "*");
});

// calculate item price and quantity
function calculate(item_price)
{
    if(!compared)
    {
        if(orderquantity > storequnatity)
        {
            console.log("Insufficient quantity!\nPlease select a lower quantity or a different Item.\n");
            return questions();
        }

        compared = true;
        database("update", "products", [{stock_quantity: storequnatity - orderquantity}, {item_id: user_id}]);
        database("read", "products",{item_id: user_id} ,"price");
    }
    else
    {
        console.log("The total price for your purchase is $" + item_price * orderquantity);
        compared = false;
        connection.end();

    }
}

// ask questions
function questions()
{
    inquirer
  .prompt([
    {
        type: "input",
        message: "What is the ID of the Item you would like to buy?",
        name: "id",
        validate: function IDvalidate(value)
        {
            if(value % 1 === 0)
            {
                var valid = !isNaN(parseInt(value));
                if(valid)
                {
                    if(value > numItems)
                    {
                        return "There is no item with an id of " + value;
                    }
                }
                return valid || value + " is not an ID";
            }
            else
            {
                return "There is no item with an id of " + value;
            }
            
        }
    },

    {   
        type: "input",
        message: "How many would you like to buy?",
        name: "quantity",
        validate: function IDvalidate(value)
        {
            // validate for correct info input
            if(value % 1 === 0)
            {
                var valid = !isNaN(parseInt(value));
                return valid || "Please enter a number";
            }
            else
            {
                return "Please input a whole number";
            }
        }
    }

  ])
  .then(answers => {
      orderquantity = answers.quantity;
      user_id = answers.id;
       database("read", "products", {item_id: user_id}, "stock_quantity");
  });
};


// database function for all CRUD actions
function database(action, table, data, column)
{
    switch (action)
    {
        case "read":
        if(typeof(data) === "object" && typeof(data) != "string")
        {
            connection.query("SELECT " + column + " FROM " + table + " WHERE ?",data, function(err, responce)
            { if(err)throw err;
                if(compared) return calculate(responce[0].price);
 
                storequnatity = responce[0].stock_quantity; 
                calculate();

            });
        }
        else
        {
            column = data;
            connection.query("SELECT " + column + " FROM " + table , function(err, responce)
            { if(err)throw err;
                console.log("ID," + " Product Name," + " department," + " price," + " stock"); 
                for(data in responce)
                {
                    console.log(responce[data].item_id + " " + responce[data].product_name +" " + responce[data].department_name + " $" + responce[data].price + " " + responce[data].stock_quantity + " left");
                    numItems++;
                } 
                questions();
            });
        }
        break;

        case "update":
         connection.query("update " + table + " SET ? WHERE ?", data, function(err, responce)
        { if(err) throw err;
            
        });
        break;
    };
};