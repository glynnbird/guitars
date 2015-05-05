var x = function(doc) {
  doc._id = doc.product_id;
  delete doc.product_id;
  doc.year = parseInt(doc.year);
  doc.price = parseFloat(doc.price);
  doc.sold = (doc.sold == "TRUE");
  return doc;
}

module.exports = x;
