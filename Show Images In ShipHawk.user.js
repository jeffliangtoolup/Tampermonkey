// ==UserScript==
// @name         Show Images In ShipHawk
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Adds images in shiphawk. This adds click to copy UPC and enlarge image.
// @author       Jeff Liang
// @match        https://shiphawk.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=shiphawk.com
// @grant        none
// ==/UserScript==

(function(open) {
    XMLHttpRequest.prototype.open = function() {
        var currId = null;
        this.addEventListener("readystatechange", function(data) {
            if (window.location.href.indexOf("ready-to-ship") > 0 && data.currentTarget.responseURL == "https://shiphawk.com/api/v4/orders/find") {
                var shipElem = document.querySelector('.test')
                if (shipElem) {
                    shipElem.remove()
                }

                var info = JSON.parse(data.currentTarget.response);
                if (currId == info.order_number) {
                    return;
                }
                currId = info.order_number;

                setTimeout(function() {
                    var tableRows = document.querySelectorAll('.MuiTableRow-root');
                    var orders = {}
                    // Copy to UPC functionality
                    for (var i=1; i<tableRows.length; i++) {
                        var sku = tableRows[i].children[1].textContent;
                        let upcElem = tableRows[i].children[2]
                        let upc= upcElem.textContent;
                        upcElem.addEventListener('click', function() {
                            navigator.clipboard.writeText(upc);
                        }, false);

                        orders[sku.toLowerCase()] = i;

                    }
                    // Add carrier information to labels
                    addOrderInfo()

                    // Adds images to item lines
                    document.querySelector('.MuiTable-root').style = "overflow:visible; border:none; margin-left: 35%"
                    var tableRoot = document.querySelectorAll('.MuiTableRow-root');
                    addHeaderRow(tableRoot, 'Description');
                    addHeaderRow(tableRoot, 'Weight');

                    info.order_line_items.forEach((orderContainer, i) => {
                        //Add weight column
                        orderContainer.line_item_skus.forEach((order, idx) => {
                            var index = orders[order.sku.toLowerCase()]

                            addBodyRow(tableRoot, index, order.name);
                            addBodyRow(tableRoot, index, order.weight);

                            if (order.description) {
                                var parsedOrder = JSON.parse(order.description);
                                var image = parsedOrder.productImage;
                                if (image) {
                                    //img_${idx}.left ="50%"; img_${idx}.right ="50%";
                                    tableRows[index].firstChild.innerHTML = `<img
                                name="img_${idx}"
                                onmouseover="img_${idx}.style='position:fixed; left:20%; top:35%; border: 1px solid #555'; img_${idx}.width=500; img_${idx}.height=500;"
                                onmouseout="img_${idx}.style='position:static; left:50%; top:50%; border: 1px solid #555'; img_${idx}.width=100; img_${idx}.height=100"
                                width='100'
                                height='100'
                                style = "border: 1px solid #555;"
                                src='${image}'>`;
                                }
                            }
                        })
                    })

                    function addHeaderRow(tableRoot, name) {
                        var childs = document.querySelectorAll('.MuiTableCell-root');
                        var count = 0;

                        for (var i=0; i<childs.length; i++) {
                            if (childs[i].nodeName == "TH") {
                                count++
                            }
                        }

                        var rowElem = document.createElement('th');
                        rowElem.innerHTML = name;
                        var classes = childs[0].classList;
                        var className = classes[classes.length - 1]
                        rowElem.classList.add("MuiTableCell-root", "MuiTableCell-head", className);

                        tableRoot[0].insertBefore(rowElem, childs[count - 1])
                    }

                    function addBodyRow(tableRoot, index, value) {
                        var bodyElem = document.createElement('td');
                        bodyElem.innerHTML = `<td width="40%">${value || "N/A"}</td>`
                        bodyElem.classList.add( "MuiTableCell-body", "jss68");
                        var cells = tableRoot[index].children;
                        tableRoot[index].insertBefore(bodyElem, cells[cells.length - 1]);
                    }


                    function addOrderInfo(){
                        var carrierImgMap = {
                            "FedEx": "https://shiphawk-assets-rackspace-production.s3.amazonaws.com/uploads/fedex.png",
                            "FedEx Freight": "https://shiphawk-assets-rackspace-production.s3.amazonaws.com/uploads/fedex.png",
                            "UPS": "https://shiphawk-assets-rackspace-production.s3.amazonaws.com/uploads/ups.png",
                            "SAIA Freight": "https://shiphawk-assets-rackspace-production.s3.amazonaws.com/uploads/saia.png",
                            "XPO Logistics Freight, Inc.": "https://shiphawk-assets-rackspace-production.s3.amazonaws.com/uploads/xpo_ltl.png",
                            "USPS Pitney Bowes": "https://shiphawk-assets-rackspace-production.s3.amazonaws.com/uploads/usps_pitney_bowes.png"
                        }

                        var newDiv = document.createElement('div');
                        var proposedShipment = info.proposed_shipments[0];
                        var carrier = proposedShipment.carrier;

                        newDiv.innerHTML = `<img width=100 src="${carrierImgMap[carrier]}"> </img><p>Rate: \$${proposedShipment.total_price}</p>`;
                        newDiv.classList.add("test")
                        var test = document.querySelector('.MuiTypography-body2')
                        test.appendChild(newDiv)
                    }

                }, 1000)
            }
        }, false);

        open.apply(this, arguments);
    };
})(XMLHttpRequest.prototype.open);