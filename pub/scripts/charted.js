/*global $, PageController */

$(function () {
  var $dataInput = $('.data-file-input')
  var pageController = new PageController()

  $('.load-data-form').submit(function (e) {
    e.preventDefault()

    if($dataInput.val()) {
      pageController.setupPage({dataUrl: $dataInput.val()})
    } else {
      var emptyInputError = new Error('You’ll need to paste in the URL to a .csv file or Google Spreadsheet first.')
      pageController.errorNotify(emptyInputError)
    }
  })

  // parse the url on page load and every state change
  pageController.useUrl()
  $(window).on('popstate', pageController.useUrl.bind(pageController))

  pageController.textToData = function(text) {
    // mimic 'Page Data'
    var data = JSON.parse(text);
    var _indices = d3.range(data.length).map(function (i) {
      return 'Row ' + (i + 1)
    });
    var keys = Object.keys(data[0]);
    var _serieses = keys.map(function (label, i) {
      return {
        label: label,
        seriesIndex: i
      }
    });
    var _data = keys.map(function (label) {
      return data.map(function (row, i) {
        return {
          x: i,
          xLabel: _indices[i],
          y: Utils.stringToNumber(row[label]),
          yRaw: row[label]
        };
      });
    });
    return {
      _indices: _indices,
      _serieses: _serieses,
      _data: _data,
      getSerieses: function () { return _serieses; },
      getSeries: function (i) { return _serieses[i]; },
      getSeriesCount: function () { return _serieses.length; },
      getDatumCount: function () { return _data[0].length; }
    };
  };

  pageController.socket = new WebSocket("ws://localhost:4808/data");
  pageController.socket.onmessage = function(event) {
    if (!this.parameters || this.parameters.dataUrl) {
      // no plot or non-gog plot
      pageController.setupPage({});
      this.data = this.textToData(event.data);
      this.drawCharts();
    } else {
      // existing gog plot to update
      this.data = this.textToData(event.data);
      this.drawCharts();
    };
  }.bind(pageController);

})
