
var CLOUDANT_URL = "https://reader.cloudant.com";
var filter = [ ];


// sanitise a string so that it can be used safely in a Lucene search
var sanitise = function(str, quote) {
  var s = str.replace(/'/g,"");
  s = s.replace(/\W/g," ");
  if(quote) {
    return '"' + s + '"';
  } else {
    return s;
  }
}

var doSearch = function(searchText,filter, callback) {
//  disableAllCheckBoxes();
  $('#loading').show();
  var q = "";
  var sort = null;
  if(searchText.length>0) {
    q = sanitise(searchText, false);
  } else {
    q = "*:*";
  }
  
  // add filter to the query string - filter is an array of stuff
  for(var i in filter) {
    q += " AND ";
    q += filter[i].key + ":" + sanitise(filter[i].value, true);
  }
  
  // render the query and filter
//  $('#qs').html(q);  
  var limit = 10;  
  var counts = ["type","range","brand","country","year"];    
  var qs = {
      q: q,
      limit:limit,
      counts: JSON.stringify(counts),
      include_docs:true
    };  

  var obj = {
    url: CLOUDANT_URL + "/guitars/_design/search/_search/search",
    data: qs,
    dataType: "json",
    method: "get"
  };
  
  $.ajax(obj).done(function(data) {
    $('#loading').hide();
    if (callback) {
      callback(null, data);
    }
  }).fail(function(err,msg,e) {
    console.log("ERROR",msg);
  });
  
};

// render a list of facets from the object 'datacounts' using the item 'facet'.
var renderFacetGroup = function(facet, title, datacounts) {
  var html = '<h4>' + title + '</h4>';
  var i=0;
  for(var j in datacounts[facet]) {

    html += '<div class="row facet-row">';
    html += '  <div class="col-xs-12">';
    html += '    <a href="Javascript: applyFilter(\'' + facet+ '\',\''+j +'\')">' + j + ' (' + datacounts[facet][j]+ ')</a>';    
    html += '  </div>';    
    html += '</div>';    
    i++;
  }
  return html;
}

// render the search results 'data' as HTML
var renderSerps = function(data, searchterm, filter) {
  
  // render docs
  var html = "";
  for(var i in data.rows) {
    var doc = data.rows[i].doc;
    html += '<div class="row">';
    html += '  <div class="col-xs-12">';   
    html += '    <h3><a href="' + doc.url + '" target="_new" class="result_link" data-result-index="' + i + '">'+doc.brand + " " + doc.model +'</a></h3>';
    html += '    <div class="description">' + doc.description + '</div>';
    html += '    <img src="' + doc.image+ '" class="image-responsive pull-right notbig" />'; 
    html += '    <ul class="facets">';
    html += '      <li>Country: ' + doc.country + '</li>';
    html += '      <li>Year: ' + doc.year + '</li>';
    html += '      <li>Colour: ' + doc.colour + '</li>';
    html += '      <li>Range: ' + doc.range + '</li>';
    html += '      <li>Price: ' + doc.price + '</li>';
    html += '    </ul>';
    html += '  </div>';

    html += '</div>';
  }
  
  $('#serps').html(html);
  
  var html = '';
  html += '<div class="col-xs-12">';  
  html += renderFacetGroup("type","Type",data.counts);
  html += renderFacetGroup("range","Range",data.counts);
  html += renderFacetGroup("brand","Brand",data.counts);
  html += renderFacetGroup("country","Country",data.counts);
  html += renderFacetGroup("year","Year",data.counts);
  html += '</div>';
  $('#facets').html(html);
  
  var html = '';
  searchterm = sanitise(searchterm, false);
  if (searchterm.length == 0 ) {
    searchterm = "*"
  };
  html += '<h2>Search for "' + searchterm+ '" &nbsp; ';
  if(searchterm !="*" || filter.length>0) {
    html += '<button type="button" class="btn btn-default btn-sm" onclick="clearAll();">';
    html += '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>';
    html += '</button>';
  }
  html += '</h2>';
  if (filter.length>0) {
    html += "Filters: ";  
    for(var i in filter) {
      html += '<span class="label label-default gap">' + filter[i].key + ' = '+ filter[i].value + '     </span>'
    }
  }
  $('#searchtitle').html(html);
  
  
  
}

var checktick = function(ctrl) {

  var facet = ctrl.getAttribute('data-facet');
  var value = ctrl.getAttribute('data-value');
  var checked = $(ctrl).is(":checked");
  if(checked) {
    applyFilter(facet, value);
  } else {
    removeFilter(facet, value);
  }
  
}

// apply a new filter
var applyFilter = function(key, value) {
  for(var i in filter) {
    if(filter[i].key == key && filter[i].value==value) {
      return;
    }
  }
  var newfilter = { key: key, value:value};
  filter.push(newfilter);
  var searchterm = $('#searchterm').val();
  doSearch(searchterm, filter, function(err, data) {
    renderSerps(data, searchterm, filter);
  });
}

// remove a filter
var removeFilter = function(key, value) {
  for(var i in filter) {
    if(filter[i].key == key && filter[i].value==value) {
      filter.splice(i,1);
      break;
    }
  }
  var searchterm = $('#searchterm').val();
  doSearch(searchterm, filter, function(err, data) {
    renderSerps(data, searchterm, filter);
  });
}

var clearAll = function() {
  $('#searchterm').val("");
  submitForm();
}

var submitForm = function() {
  var searchterm = $('#searchterm').val();
  filter = [ ];
  doSearch(searchterm, { }, function(err, data) {
    renderSerps(data, searchterm, filter);
  });
  return false;
}

var onload = function() {
  searchText = "";
  filter = [];
  
  // do first search to get all the facets
  submitForm();
};

// on load
$(document).ready(onload);
  