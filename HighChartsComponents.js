import React, { useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';import React, { useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HC_more from 'highcharts/highcharts-more';
import HC_networkgraph from 'highcharts/modules/networkgraph';
import routerIcon from './icon/router-icon.svg';
import routerRed from './icon/router-red.svg';
import routerYellow from './icon/router-yellow.svg';
import nodeData from './data/nodeData.js';
import linkData from './data/linkData.js';
import LinkPropertiesComponent from './LinkProperties'
//import switchIcon from './switch-icon.svg';

// Initialize the networkgraph module
HC_more(Highcharts);
HC_networkgraph(Highcharts);
// Keep track of the currently selected link and its original color
// find efficient way to track this instead of declaring the variables globally
var selectedLink = null;
var selectedLinkOriginalColor = null;

const getColor = (node) => {
    if (node.keyValuePairs['Utilization %'] >= 80) {
        return { Color: 'red', blink: "fast" };
    } else if (node.keyValuePairs['Utilization %'] >= 60) {
        return { Color: 'yellow', blink: "slow" };
    } else {
        return { Color: 'green', blink: "none" };
    }
};



const HighchartsComponent2 = () => {
    const [selectedLink, setSelectedLink] = useState(null);
    const [selectedLinkOriginalColor, setSelectedLinkOriginalColor] = useState(null);
    const options = {
        chart: {
            type: 'networkgraph',
            events: {
                load: function () {
                    var chart = this;
                    this.series[0].points.forEach(function (point) {
                        // console.log(point.fromNode);
                        // console.log(point.toNode);
                        if (point.fromNode.color === 'red' || point.toNode.color === 'red') {
                            point.update({
                                color: 'red'
                            })
                        } else if (point.fromNode.color === 'yellow' || point.toNode.color === 'yellow') {
                            point.update({
                                color: 'yellow'
                            })
                        } else {
                            point.update({
                                color: 'green'
                            })
                        }
                    });
                    // This event is to revert back the click on link to change color and destroy tooltip when you click anywhere on the graph
                    Highcharts.addEvent(chart.container, 'click', function (e) {
                        // Check if a link was clicked
                        if (e.target.tagName === 'path') {
                            // Return early and let the click event on the link handle the event
                            return;
                        }

                        // Check if a link was clicked
                        if (!e.target.point) {
                            // Destroy the custom tooltip
                            if (chart.customTooltip) {
                                chart.customTooltip.destroy();
                                chart.customTooltip = undefined;
                            }
                            // Check if the currently selected link is null
                            if (!selectedLink) {
                                // Return early and do not try to update its attributes
                                return;
                            }

                            console.log("clicked on highchart event before selected link");

                            // Change the color of the currently selected link back to its original color

                            selectedLink && selectedLink.graphic && selectedLink.graphic.attr({
                                stroke: selectedLinkOriginalColor,
                                'stroke-width': 5
                            });

                            console.log("clicked on highchart event after selected link");

                            // Reset the currently selected link and its original color
                            selectedLink = null;
                            selectedLinkOriginalColor = null;
                        }
                    });
                    chart.rGroup = chart.renderer.g('rGroup').add() // create an SVG group to allow translate
                },
                render() {
                    const chart = this;
                    chart.series[0].nodes.forEach((node) => {
                        const nodeElement = node.graphic.element;
                        // const bbox = nodeElement.getBBox();
                        // const x = bbox.x + bbox.width / 2;
                        // const y = bbox.y + bbox.height / 2;
                        const x = node.plotX;
                        const y = node.plotY;
                        //console.log(' position of custom icon: x, y', x, y);

                        // Adjust the x and y coordinates of the custom SVG image element
                        const iconWidth = 40;
                        const iconHeight = 40;
                        const adjustedX = x - iconWidth / 2;
                        const adjustedY = y - iconHeight / 2;
                        //console.log(' position of custom icon:adjustedX,adjustedY', adjustedX, adjustedY);
                        // Check if a custom icon has already been added to the node
                        if (node.customIcon) {
                            // Update the position of the custom icon
                            node.customIcon.attr({
                                x: adjustedX,
                                y: adjustedY,
                            });
                            //console.log('Updated position of custom icon:', adjustedX, adjustedY);
                        } else {
                            let blink = node.blink;
                            let icon = routerIcon;
                            if (node.color === 'red') {
                                icon = routerRed
                            } else if (node.color === 'yellow') {
                                icon = routerYellow
                            }
                            // Create a custom SVG image element using the Highcharts.SVGRenderer class
                            const customElement = chart.renderer
                                .image(icon, adjustedX, adjustedY, iconWidth, iconHeight)
                                .add();
                            // Add the 'blink' CSS class to the custom SVG image element if the 'blink' property is true
                            if (blink === 'fast') {
                                customElement.addClass('blink-fast');
                            } else if (blink === 'slow') {
                                customElement.addClass('blink-slow');
                            }
                            // Replace the default node element with the custom element
                            if (nodeElement.parentNode) {
                                // Replace the default node element with the custom element
                                nodeElement.parentNode.replaceChild(customElement.element, nodeElement);
                                // Store a reference to the custom icon in the node object

                                node.customIcon = customElement;
                            }
                        }
                    });
                }
            }
        },
        title: {
            text: 'Network Graph Sidebar for link'
        },
        tooltip: {
            // we can use the below propeties to customize the tooltip
            // useHTML: true,
            // backgroundColor: 'white',
            // borderWidth: 0,
            // borderRadius: 10,
            // shadow: false,
            // style: {
            //   padding: 0
            // },
            formatter: function () {
                // `this.point` refers to the node that is being hovered over
                const node = this.point;

                // Get the key-value pairs for this node
                const keyValuePairs = node.keyValuePairs;

                // Generate the content of the tooltip as an HTML string
                let tooltipContent = `<b>${node.name}</b><br>`;
                if (keyValuePairs) {
                    for (const [key, value] of Object.entries(keyValuePairs)) {
                        tooltipContent += `${key}: ${value}<br>`;
                    }
                }
                return tooltipContent;
            }
        },
        plotOptions: {
            networkgraph: {
                layoutAlgorithm: {
                    linkLength: 30
                },
                keys: ['from', 'to']
            },
            series: {
                cursor: 'pointer',
                events: {
                    // this event is to destroy the custom tooltip of links when we hover over nodes
                    mouseOver: function () {
                        // destroy the custom tooltip
                        if (this.chart.customTooltip) {
                            this.chart.customTooltip.destroy();
                            this.chart.customTooltip = undefined;
                        }
                    }
                }
                // point: {
                //     events: {
                //         click: function () {
                //             console.log("click event triggered");
                //             // update the color and width of this link
                //             this.update({
                //                 color: 'red',
                //                 lineWidth: 3
                //             });
                //         }
                //     }
                // }
            }
        },
        series: [{
            dataLabels: {
                enabled: true,
                linkFormat: ''
            },
            link: {
                width: 5 // Set link width to 5
            },
            nodes: nodeData.map(node => ({
                ...node,
                color: getColor(node).Color,// set the color based on the value of myProperty
                blink: getColor(node).blink
            })),
            data: linkData
        }]
    };
    const handleLinkSelection = (line, chart) => {
        // Check if this link is the currently selected link
        if (selectedLink === line) {
            // Destroy the custom tooltip
            if (chart.customTooltip) {
                chart.customTooltip.destroy();
                chart.customTooltip = undefined;
            }
            // Change the color of the link back to its original color
            if (line.graphic) {
                line.graphic.attr({
                    stroke: selectedLinkOriginalColor,
                    'stroke-width': 5
                });
            }

            // Reset the currently selected link and its original color
            setSelectedLink(null);
            setSelectedLinkOriginalColor(null);
        } else {
            // Destroy the custom tooltip
            if (chart.customTooltip) {
                chart.customTooltip.destroy();
                chart.customTooltip = undefined;
            }
            // Change the color of the currently selected link back to its original color
            if (selectedLink && selectedLink.graphic) {
                selectedLink.graphic.attr({
                    stroke: selectedLinkOriginalColor,
                    'stroke-width': 5
                });
            }

            // Update the currently selected link and its original color
            setSelectedLink(line);
            setSelectedLinkOriginalColor(line.graphic && line.graphic.attr && line.graphic.attr('stroke'));

            // Change the color of this link to blue
            if (line.graphic) {
                line.graphic.attr({
                    stroke: 'blue',
                    'stroke-width': 8
                });
            }

            if (chart.customTooltip) {
                chart.customTooltip.destroy();
                chart.customTooltip = null;
            }

            // Render the tooltip
            chart.customTooltip = chart.renderer.label(
                'ConnectedTo: ' + line.from + ' - ' + line.to + '<br>Link Properties: <br>Connection Type: ' + line.options.connection_type + '<br>Count: ' + line.options.count + '<br>Key1: ' + line.options.key1 + '<br>Key2: ' + line.options.key2 + '<br>Key3: ' + line.options.key3 + '<br>Key4: ' + line.options.key4,
                chart.plotLeft + line.plotX,
                chart.plotTop + line.plotY,
                null,
                null,
                null,
                true
            )
                .attr({
                    'stroke-width': 1,
                    zIndex: 8,
                    stroke: 'black',
                    padding: 8,
                    r: 3,
                    fill: 'white'
                })
                .add(chart.rGroup);
        }

        if (chart.customTooltip) chart.rGroup.translate(-chart.customTooltip.width / 2, -chart.customTooltip.height - 15).toFront();
    };

    Highcharts.seriesTypes.networkgraph.prototype.pointClass.prototype.renderLink = function () {
        const line = this;
        const chart = line.series.chart;

        if (!line.graphic) {
            line.graphic = chart.renderer
                .path(this.getLinkPath())
                .attr({
                    'stroke-width': 40
                })
                .on('click', function (e) {
                    handleLinkSelection(line, chart);
                })
                .add(this.series.group);
        }
    };

    return (
        <div id="myChart">
            <HighchartsReact
                highcharts={Highcharts}
                options={options}
                containerProps={{ style: { height: '100%', width: '100%' } }}
            />
        </div>
    )
};

export default HighchartsComponent2;
import HC_more from 'highcharts/highcharts-more';
import HC_networkgraph from 'highcharts/modules/networkgraph';
import routerIcon from './icon/router-icon.svg';
import routerRed from './icon/router-red.svg';
import routerYellow from './icon/router-yellow.svg';
import nodeData from './data/nodeData.js';
import linkData from './data/linkData.js';
import LinkPropertiesComponent from './LinkProperties'
//import switchIcon from './switch-icon.svg';

// Initialize the networkgraph module
HC_more(Highcharts);
HC_networkgraph(Highcharts);
// Keep track of the currently selected link and its original color
// find efficient way to track this instead of declaring the variables globally
var selectedLink = null;
var selectedLinkOriginalColor = null;

const getColor = (node) => {
    if (node.keyValuePairs['Utilization %'] >= 80) {
        return { Color: 'red', blink: "fast" };
    } else if (node.keyValuePairs['Utilization %'] >= 60) {
        return { Color: 'yellow', blink: "slow" };
    } else {
        return { Color: 'green', blink: "none" };
    }
};



const HighchartsComponent2 = () => {
    const [linkProperties, setLinkProperties] = useState(null);
    const updateLinkProperties = (linkProperties) => {
        setLinkProperties(linkProperties);
    };
    const options = {
        chart: {
            type: 'networkgraph',
            events: {
                load: function () {
                    var chart = this;
                    // Set a custom property on the chart object to the updateLinkProperties function
                    this.updateLinkProperties = updateLinkProperties;
                    this.series[0].points.forEach(function (point) {
                        // console.log(point.fromNode);
                        // console.log(point.toNode);
                        if (point.fromNode.color === 'red' || point.toNode.color === 'red') {
                            point.update({
                                color: 'red'
                            })
                        } else if (point.fromNode.color === 'yellow' || point.toNode.color === 'yellow') {
                            point.update({
                                color: 'yellow'
                            })
                        } else {
                            point.update({
                                color: 'green'
                            })
                        }
                    });
                    // This event is to revert back the click on link to change color and destroy tooltip when you click anywhere on the graph
                    Highcharts.addEvent(chart.container, 'click', function (e) {
                        // Check if a link was clicked
                        if (e.target.tagName === 'path') {
                            // Return early and let the click event on the link handle the event
                            return;
                        }

                        // Check if a link was clicked
                        if (!e.target.point) {
                            // Destroy the custom tooltip
                            if (chart.customTooltip) {
                                chart.customTooltip.destroy();
                                chart.customTooltip = undefined;
                            }
                            // Check if the currently selected link is null
                            if (!selectedLink) {
                                // Return early and do not try to update its attributes
                                return;
                            }

                            console.log("clicked on highchart event before selected link");

                            // Change the color of the currently selected link back to its original color

                            selectedLink && selectedLink.graphic && selectedLink.graphic.attr({
                                stroke: selectedLinkOriginalColor,
                                'stroke-width': 5
                            });

                            console.log("clicked on highchart event after selected link");

                            // Reset the currently selected link and its original color
                            selectedLink = null;
                            selectedLinkOriginalColor = null;
                        }
                    });
                    chart.rGroup = chart.renderer.g('rGroup').add() // create an SVG group to allow translate
                },
                render() {
                    const chart = this;
                    chart.series[0].nodes.forEach((node) => {
                        const nodeElement = node.graphic.element;
                        // const bbox = nodeElement.getBBox();
                        // const x = bbox.x + bbox.width / 2;
                        // const y = bbox.y + bbox.height / 2;
                        const x = node.plotX;
                        const y = node.plotY;
                        //console.log(' position of custom icon: x, y', x, y);

                        // Adjust the x and y coordinates of the custom SVG image element
                        const iconWidth = 40;
                        const iconHeight = 40;
                        const adjustedX = x - iconWidth / 2;
                        const adjustedY = y - iconHeight / 2;
                        //console.log(' position of custom icon:adjustedX,adjustedY', adjustedX, adjustedY);
                        // Check if a custom icon has already been added to the node
                        if (node.customIcon) {
                            // Update the position of the custom icon
                            node.customIcon.attr({
                                x: adjustedX,
                                y: adjustedY,
                            });
                            //console.log('Updated position of custom icon:', adjustedX, adjustedY);
                        } else {
                            let blink = node.blink;
                            let icon = routerIcon;
                            if (node.color === 'red') {
                                icon = routerRed
                            } else if (node.color === 'yellow') {
                                icon = routerYellow
                            }
                            // Create a custom SVG image element using the Highcharts.SVGRenderer class
                            const customElement = chart.renderer
                                .image(icon, adjustedX, adjustedY, iconWidth, iconHeight)
                                .add();
                            // Add the 'blink' CSS class to the custom SVG image element if the 'blink' property is true
                            if (blink === 'fast') {
                                customElement.addClass('blink-fast');
                            } else if (blink === 'slow') {
                                customElement.addClass('blink-slow');
                            }
                            // Replace the default node element with the custom element
                            if (nodeElement.parentNode) {
                                // Replace the default node element with the custom element
                                nodeElement.parentNode.replaceChild(customElement.element, nodeElement);
                                // Store a reference to the custom icon in the node object

                                node.customIcon = customElement;
                            }
                        }
                    });
                }
            }
        },
        title: {
            text: 'Network Graph Sidebar for link'
        },
        tooltip: {
            // we can use the below propeties to customize the tooltip
            // useHTML: true,
            // backgroundColor: 'white',
            // borderWidth: 0,
            // borderRadius: 10,
            // shadow: false,
            // style: {
            //   padding: 0
            // },
            formatter: function () {
                // `this.point` refers to the node that is being hovered over
                const node = this.point;

                // Get the key-value pairs for this node
                const keyValuePairs = node.keyValuePairs;

                // Generate the content of the tooltip as an HTML string
                let tooltipContent = `<b>${node.name}</b><br>`;
                if (keyValuePairs) {
                    for (const [key, value] of Object.entries(keyValuePairs)) {
                        tooltipContent += `${key}: ${value}<br>`;
                    }
                }
                return tooltipContent;
            }
        },
        plotOptions: {
            networkgraph: {
                layoutAlgorithm: {
                    linkLength: 30
                },
                keys: ['from', 'to']
            },
            series: {
                cursor: 'pointer',
                events: {
                    // this event is to destroy the custom tooltip of links when we hover over nodes
                    mouseOver: function () {
                        // destroy the custom tooltip
                        if (this.chart.customTooltip) {
                            this.chart.customTooltip.destroy();
                            this.chart.customTooltip = undefined;
                        }
                    }
                }
                // point: {
                //     events: {
                //         click: function () {
                //             console.log("click event triggered");
                //             // update the color and width of this link
                //             this.update({
                //                 color: 'red',
                //                 lineWidth: 3
                //             });
                //         }
                //     }
                // }
            }
        },
        series: [{
            dataLabels: {
                enabled: true,
                linkFormat: ''
            },
            link: {
                width: 5 // Set link width to 5
            },
            nodes: nodeData.map(node => ({
                ...node,
                color: getColor(node).Color,// set the color based on the value of myProperty
                blink: getColor(node).blink
            })),
            data: linkData
        }]
    };
    const handleLinkSelection = (line, chart, updateLinkProperties) => {
        // Check if this link is the currently selected link
        if (selectedLink === line) {
            // Destroy the custom tooltip
            if (chart.customTooltip) {
                chart.customTooltip.destroy();
                chart.customTooltip = undefined;
            }
            // Change the color of the link back to its original color
            if (line.graphic) {
                line.graphic.attr({
                    stroke: selectedLinkOriginalColor,
                    'stroke-width': 5
                });
            }

            // Reset the currently selected link and its original color
            selectedLink = null;
            selectedLinkOriginalColor = null;
        } else {
            // Destroy the custom tooltip
            if (chart.customTooltip) {
                chart.customTooltip.destroy();
                chart.customTooltip = undefined;
            }
            // Change the color of the currently selected link back to its original color
            if (selectedLink && selectedLink.graphic) {
                selectedLink.graphic.attr({
                    stroke: selectedLinkOriginalColor,
                    'stroke-width': 5
                });
            }

            // Update the currently selected link and its original color
            selectedLink = line;
            selectedLinkOriginalColor = line.graphic && line.graphic.attr && line.graphic.attr('stroke');

            // Change the color of this link to blue
            if (line.graphic) {
                line.graphic.attr({
                    stroke: 'blue',
                    'stroke-width': 8
                });
            }

            if (chart.customTooltip) {
                chart.customTooltip.destroy();
                chart.customTooltip = null;
            }

            updateLinkProperties(line.options);

            // Render the tooltip
            chart.customTooltip = chart.renderer.label(
                'ConnectedTo: ' + line.from + ' - ' + line.to + '<br>Link Properties: <br>Connection Type: ' + line.options.connection_type + '<br>Count: ' + line.options.count + '<br>Key1: ' + line.options.key1 + '<br>Key2: ' + line.options.key2 + '<br>Key3: ' + line.options.key3 + '<br>Key4: ' + line.options.key4,
                chart.plotLeft + line.plotX,
                chart.plotTop + line.plotY,
                null,
                null,
                null,
                true
            )
                .attr({
                    'stroke-width': 1,
                    zIndex: 8,
                    stroke: 'black',
                    padding: 8,
                    r: 3,
                    fill: 'white'
                })
                .add(chart.rGroup);
        }

        if (chart.customTooltip) chart.rGroup.translate(-chart.customTooltip.width / 2, -chart.customTooltip.height - 15).toFront();
    };

    Highcharts.seriesTypes.networkgraph.prototype.pointClass.prototype.renderLink = function () {
        const line = this;
        const chart = line.series.chart;

        if (!line.graphic) {
            line.graphic = chart.renderer
                .path(this.getLinkPath())
                .attr({
                    'stroke-width': 40
                })
                .on('click', function (e) {
                    handleLinkSelection(line, chart, chart.updateLinkProperties);
                })
                .add(this.series.group);
        }
    };

    return (
        <div id="myChart">
            <HighchartsReact
                highcharts={Highcharts}
                options={options}
                containerProps={{ style: { height: '100%', width: '100%' } }}
            />
        </div>
    )
};

export default HighchartsComponent2;
