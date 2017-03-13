var querystring = require('querystring');
var http = require('follow-redirects').http;
module.exports = {

    getPNRStatus: function (query, callback) {

        this.loadData('/pnr_status/pnr/' + querystring.escape(query) + '/apikey/6py78um0', callback);
    },

    loadData: function (path, callback) {
        var options = {
            host: 'api.railwayapi.com',
            path: path,
            method: 'GET',
            headers:{
                'Content-type' : 'application/json'
            }
        };
        var profile;
        var request = http.request(options, function (response) {
                var data = '';
                response.on('data', function (chunk) { data += chunk; });
                response.on('end', function () {
                    if(data.charAt(0) == '<')
                    {
                        callback(data);
                    }
                    else
                    {
                        callback(JSON.parse(data));
                    }
                });
        });
        request.end();
    }
}