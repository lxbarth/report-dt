var host = 'http://localhost:3021/';
//var host = 'http://54.172.162.212:3022/'
var type = 'd';
var dates = document.URL.split('#')[1].split('&');
type = dates[0];
var start_str = dates[1];
var end_str = dates[2];
var start_times = new Date(start_str + " 00:00:00").getTime() / 1000;
var end_times = new Date(end_str + " 00:00:00").getTime() / 1000;

$.ajax({
    dataType: "json",
    url: host + type + '&' + start_times + '&' + end_times,
    success: function(json) {
        draw_bart(json);
        location.href = document.URL.split('#')[0] + '#h' + '&' + start_str + '&' + end_str;
    }
});

function draw_bart(test_data) {

    var chart;
    nv.addGraph(function() {
        chart = nv.models.multiBarChart()
            //.barColor(d3.scale.category20().range())
            .margin({
                bottom: 100
            })
            .transitionDuration(300)
            .delay(0)
            .rotateLabels(0)
            .groupSpacing(0.1);

        chart.multibar
            .hideable(true);

        chart.reduceXTicks(false).staggerLabels(true);

        /* chart.xAxis
             .axisLabel("Hours")
             .showMaxMin(true)
             .tickFormat(d3.format(','));*/

        chart.xAxis.tickFormat(function(d) {

            //2014-11-09 23
            return d.split(' ')[0].substring(8, 11) + '-' + d.split(' ')[1] + 'h';
            /*
                        var dx = d[0].values[d] && d[0].values[d][0] || 0;
                        return d3.time.format('%x')(new Date(dx))*/
        });

        chart.yAxis
            .tickFormat(d3.format(',.H'));

        d3.select('#chart1 svg')
            .datum(test_data)
            .call(chart);

        nv.utils.windowResize(chart.update);

        chart.dispatch.on('stateChange', function(e) {
            nv.log('New State:', JSON.stringify(e));
        });

        return chart;
    });
}



$(document).ready(function() {
    //1416096000 AND d.osmdate<1416182400
    //#h&2014-11-15&2014-11-16


    if (start_times > end_times) {
        return null;
    } else {
        console.log('fine');
    }

    $('.date-picker').val(dates[1]);
    $('.date-picker1').val(dates[2]);


    $(".date-picker").datepicker({
        weekStart: 1,
        dateFormat: 'yy-mm-dd'
    });


    $(".date-picker1").datepicker({
        weekStart: 1,
        dateFormat: 'yy-mm-dd'
    });


    $(".date-picker").on("change", function() {
        process_draw();
    });


    $(".date-picker1").on("change", function() {
        process_draw();
    });



    $(".dropdown-menu li a").click(function() {
        var selText = $(this).text();
        $(this).parents('.btn-group').find('.dropdown-toggle').html(selText + ' <span class="caret"></span>');
    });



});


function todate(timestamp) {
    var date = new Date(timestamp * 1000);
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();

    return year + '-' + month + '-' + day;
}


function process_draw() {
    $('#chart1').empty();
    $('#chart1').html('<svg></svg>');
    start_str = $('.date-picker').val();
    start_times = new Date(start_str + " 00:00:00").getTime() / 1000;
    end_str = $('.date-picker1').val();
    end_times = new Date(end_str + " 00:00:00").getTime() / 1000;
    console.log(host + type + '&' + start_times + '&' + end_times);
    $.ajax({
        dataType: "json",
        url: host + type + '&' + start_times + '&' + end_times,
        success: function(json) {
            draw_bart(json);
            location.href = document.URL.split('#')[0] + '#h' + '&' + start_str + '&' + end_str;
        }
    });
}