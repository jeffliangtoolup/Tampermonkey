// ==UserScript==
// @name         Show Images In ShipHawk
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://shiphawk.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=shiphawk.com
// @grant        none
// ==/UserScript==

(function(open) {
    XMLHttpRequest.prototype.open = function() {
        var ran = false;
        this.addEventListener("readystatechange", function(data) {
            if (window.location.href.indexOf("ready-to-ship") > 0 && data.currentTarget.responseURL == "https://shiphawk.com/api/v4/orders/find") {
                var info = JSON.parse(data.currentTarget.response);
                setTimeout(function() {
                    var tableRows = document.querySelectorAll('.MuiTableRow-root');
                    var orders = {}
                    for (var i=1; i<tableRows.length; i++) {
                        var sku = tableRows[i].children[1].textContent;
                        console.log(sku)
                        let upcElem = tableRows[i].children[2]
                        let upc= upcElem.textContent;
                        upcElem.addEventListener('click', function() {
                            navigator.clipboard.writeText(upc);
                            console.log('COPIED', upc)
                        }, false);

                        orders[sku] = i;

                    }

                    try {
                        info.order_line_items.forEach( (order, idx) => {
                            if (order.description) {
                                var parsedOrder = JSON.parse(order.description);
                                var image = parsedOrder.productImage;
                                if (image) {
                                    var index = orders[order.sku]
                                    //img_${idx}.left ="50%"; img_${idx}.right ="50%";
                                    tableRows[index].firstChild.innerHTML = `<img
                                name="img_${idx}"
                                onmouseover="img_${idx}.style='position:fixed; left:20%; top:35%'; img_${idx}.width=500; img_${idx}.height=500;"
                                onmouseout="img_${idx}.style='position:static; left:50%; top:50%'; img_${idx}.width=100; img_${idx}.height=100" width='100' height='100' src='${image}'>`;
                                }
                            }
                        })
                        document.querySelector('.MuiTable-root').style = "overflow: visible; border:none"
                    }catch (e) {
                        console.log(e)
                    }

                }, 1000)
            }

        }, false);
        open.apply(this, arguments);
    };
})(XMLHttpRequest.prototype.open);