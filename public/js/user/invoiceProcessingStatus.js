﻿//import { identifier } from "babel-types";
"use strict";

$(function () {
    _init();
});

var _init = function () {
    var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
        'October', 'November', 'December'];
		var config = {
            type: 'line',
			data: {
                labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
				datasets: [{
                    label: '',
                    backgroundColor: 'rgba(255,255,255,1)',
                    borderColor: 'rgba(234,113,105,1)',
                    data: [5,4,7,8,3,3,0],
                    fill: false,
                }]
            },
			options: {
            legend: {
                display: false
            },
			tooltips: {
                enabled: true,
                mode: 'index',
                position: 'nearest',
					callbacks: {
                        label: function(tooltipItem) {
                            return tooltipItem.yLabel;
                        }
                    }
                },
				scales: {
                    yAxes: [{
                        ticks: {
                            stepSize: 1,
                            suggestedMin: 0,
                            suggestedMax: 10,
                        }
                    }]
                }
            }
        };

		window.onload = function() {
			var ctx = document.getElementById('line').getContext('2d');
        window.myLine = new Chart(ctx, config);
    };

};