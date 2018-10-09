'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const sgMail = require('@sendgrid/mail');
const app = express();
var fs = require('fs'),
    path = require('path'),    
    filePath = path.join(__dirname, 'product_en.html');
   // filePath = path.join(__dirname, 'test2.html');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/version', (req, res) => {
    res.status(200).send("APIAI Webhook Integration. Version 1.0");
});

app.get('/', (req, res) => {
    res.status(200).send("Hello from APIAI Webhook Integration.");
});

/* Handling all messenges */
app.post('/', (req, res) => {
   // console.log(req.body);
   var body = req.body["queryResult"];
   var htmlContentstring;
   var sku = body.parameters.skuNo;
   var skuString = sku.toString();
	var skuUpperCase = skuString.toUpperCase();
   console.log("sku:" +skuUpperCase );
   var resellerno = req.body.queryResult.outputContexts[0].parameters.resellerNo;
   var resellerString = resellerno.toString();
	if (!resellerString.includes("-")) {
	resellerString = resellerString.slice(0, 2) + "-" + resellerString.slice(2);	
    }
    
   console.log("reseller number: " +resellerString);

   var variableABC = "abcde";
   console.log(variableABC); 
   variableABC = variableABC.replace('b', 'a');
   console.log(variableABC);
          
   var prodDesciption;
	var stockInfo;

	var encoding = require("./encode.js");
	var encryptValue = encoding.encode('APPCHATBOT:@16Pc7T2ot');
	
var body = {  
   "servicerequest":{  
      "priceandstockrequest":{  
         
   
         "item":[  
            {  
               "ingrampartnumber": skuUpperCase
               
            }
         ],
         "includeallsystems":false
      },
      "requestpreamble":{  
         "customernumber": resellerString,
         "isocountrycode": "MX"
      }
   }
};

fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
    if (!err) {
      //htmlContent = data;
      htmlContentstring = data.toString();
     
    //   console.log(htmlContentstring);
      
    } else {
        console.log(err);
    }
});



    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
	var xhttp = new XMLHttpRequest();

xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
       // Typical action to be performed when the document is ready:

        var response = xhttp.responseText;
        console.log(response);

	var jsonResponse = JSON.parse(response);

	var serviceResponse = jsonResponse.serviceresponse;

	var responsepreamble = serviceResponse.responsepreamble;
	
	var priceandstockresponse = serviceResponse.priceandstockresponse;
	
	var details = priceandstockresponse.details;

	var prodDetails = details[0];

	
	if (responsepreamble.responsestatus == "SUCCESS"){
	console.log("success");
	var wareHouse = prodDetails.warehousedetails;

	var i;
	var qtyAvaliable = 0;
	for (i = 0; i < wareHouse.length; i++) { 
		var qty = wareHouse[i];
    		qtyAvaliable += qty["availablequantity"];
	}
	console.log(qtyAvaliable);	

	if (qtyAvaliable == 0) {
        stockInfo = "Out of Stock";
        htmlContentstring = htmlContentstring.replace('{OUT_OF_STOCK}',stockInfo);
        htmlContentstring = htmlContentstring.replace('{DISPLAY_VALUE_INSTOCK}','none');
	}else{
        stockInfo = qtyAvaliable;
        htmlContentstring = htmlContentstring.replace('{AMOUNT_AVAILABLE}',stockInfo);
        htmlContentstring = htmlContentstring.replace('{DISPLAY_VALUE_OUTOFSTOCK}','none');
	}
	
	prodDesciption = "The cost of the product is $" +prodDetails.customerprice + "\n" + "and the available stock is "+ stockInfo;
	//return prodDesciption;
	} else {

	console.log("failure");
	var message = prodDetails.statusmessage;
	
	prodDesciption = message;
	//return prodDesciption;
    }
        
    if(prodDetails.itemstatus != 'FAILED')
    {
    
    htmlContentstring = htmlContentstring.replace('{PRODUKT_NAME}',prodDetails.partdescription1);
    htmlContentstring = htmlContentstring.replace('{SKU}',prodDetails.globalskuid);
    htmlContentstring = htmlContentstring.replace('{VENDOR_ID}',prodDetails.vendornumber);
    htmlContentstring = htmlContentstring.replace('{VENDOR_NAME}',prodDetails.vendorname);
   htmlContentstring = htmlContentstring.replace('{PRICE_ELEMENTS}',prodDetails.currency +' ' + prodDetails.customerprice);
   htmlContentstring = htmlContentstring.replace('{DESCRIPTION}',prodDetails.partdescription1);

    sgMail.setApiKey('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');
    const msg = {
      to: 'madhuradalvi333@gmail.com',
      from: 'madhuradalvi333@gmail.com',
      subject: 'Project Details',
      text :'adad',
       html: htmlContentstring,
          }; //email using sendgrid
    sgMail.send(msg);
    //console.log(htmlContentstring);

        }
        else{
            sgMail.setApiKey('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');
            const msg = {
              to: 'madhuradalvi333@gmail.com',
              from: 'madhuradalvi333@gmail.com',
              subject: 'Project Details',
              text :'adad',
               html: prodDesciption,
                  }; //email using sendgrid
            sgMail.send(msg);
        }
    // return a text response
    return res.json({
        fulfillmentText: [prodDesciption]
        });
   
   

    }
};

	
    xhttp.open("POST", "https://api.ingrammicro.com:443/multiskupriceandstockapi_v4", true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.setRequestHeader('Authorization', 'Basic ' +encryptValue); 
    xhttp.send(JSON.stringify(body));

    //Persist this in some database
    //Send out an email that new feedback has come in
    
});

const server = app.listen(process.env.PORT || 8080, () => {
  console.log('Webhook is listening on port %d in %s mode', server.address().port, app.settings.env);
});
