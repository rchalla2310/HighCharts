import React, { useState, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HC_networkgraph from 'highcharts/modules/networkgraph';
import nodeData from '../data/nodeData.js';
import linkData from '../data/linkData.js';
import { getColor, getTooltip, setLinkColors } from '../helpers/utils.js';
import { extendRenderLink } from '../RenderLinkCustom.js';

HC_networkgraph(Highcharts);

const HighChartsComponent = () => {
    const [clickedPoint, setClickedPoint] = useState(null);
    const [lineData, setline] = useState(null);
    useEffect(() => {
        handleLinkSelection(lineData);
    }, [lineData])
    const [options, setOptions] = useState({
        chart: {
            type: 'networkgraph',
            events: {
                load: function () {
                    var chart = this;
                    setLinkColors(chart);
                    // This event is to revert back the click on link to change color and destroy tooltip when you click anywhere on the graph
                    Highcharts.addEvent(chart.container, 'click', function (e) {
                        const selectedLink = lineData;
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
                                'stroke-width': selectedLinkOriginalWidth
                            });

                            console.log("clicked on highchart event after selected link");

                            // Reset the currently selected link and its original color
                            setSelectedLinkProperties({ selectedLink: null, selectedLinkOriginalColor: null, selectedLinkOriginalWidth: 5 });
                        }
                    });
                    chart.rGroup = chart.renderer.g('rGroup').add() // create an SVG group to allow translate
                }
            }
        },
        title: {
            text: 'Network Graph POC'
        },
        tooltip: {
            formatter: function () {
                // `this.point` refers to the node that is being hovered over
                const node = this.point;
                return getTooltip(node);
            }
        },
        plotOptions: {
            series: {
                cursor: 'pointer',
                point: {
                    events: {
                        click() {
                            setClickedPoint(this.id);
                        }
                    }
                }
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
    })
    //const [selectedLinkOriginalColor, setSelectedLinkOriginalColor] = useState(null);

    const handleLinkSelection = (line) => {
            const {
                selectedLink,
                selectedLinkOriginalColor,
                selectedLinkOriginalWidth,
            } = linkProps;

            // // Destroy the custom tooltip
            // if (chart.customTooltip) {
            //     chart.customTooltip.destroy();
            //     chart.customTooltip = undefined;
            // }
            // Check if this link is the currently selected link
            if (selectedLink === line) {
                console.log("same");
               
                // Change the color of the link back to its original color
                if (line.graphic) {
                    line.graphic.attr({
                        stroke: selectedLinkOriginalColor,
                        'stroke-width': selectedLinkOriginalWidth
                    });
                }

                // Reset the currently selected link and its original color
                setSelectedLinkProperties({ selectedLink: null, selectedLinkOriginalColor: null, selectedLinkOriginalWidth: 5 });
            } else {
                // Change the color of the currently selected link back to its original color
                if (line && line.graphic) {
                    line.graphic.attr({
                        stroke: selectedLinkOriginalColor,
                        'stroke-width': selectedLinkOriginalWidth
                    });
                }

                // Update the currently selected link and its original color
                setSelectedLinkProperties({ selectedLink: line, selectedLinkOriginalColor: line.graphic && line.graphic.attr && line.graphic.attr('stroke'), selectedLinkOriginalWidth: line.graphic && line.graphic.attr && line.graphic.attr('stroke-width') });

                // Change the color of this link to gray
                if (line.graphic) {
                    setSelectedLinkProperties({ selectedLink: line, selectedLinkOriginalColor: 'gray', selectedLinkOriginalWidth: 8 });
                    line.graphic.attr({
                        stroke: 'gray',
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

    useEffect(() => {
        //extendRenderLink(handleLinkSelection);
        console.log("Use effect called :", lineData);
        Highcharts.seriesTypes.networkgraph.prototype.pointClass.prototype.renderLink = function() {
            const line = this;
            const chart = line.series.chart;
           // console.log("renderLink called :", lineData);
            if (!line.graphic) {
                line.graphic = chart.renderer
                    .path(this.getLinkPath())
                    .attr({
                        'stroke-width': 40
                    })
                    .on('click', () => {
                        console.log("setSelectedLinkProperties inside click", lineData);
                        console.log("setline", line.connection_type)
                        setline(line)
                        handleLinkSelection(line, chart, lineData);
                    })
                    .add(this.series.group);
            }
        };
    }, []);

    console.log("lineData", lineData);
    return (<>
        <HighchartsReact
            highcharts={Highcharts}
            options={options}
        />
        {clickedPoint && <p>Clicked point: {clickedPoint}</p>}
    </>);
}

export default HighChartsComponent;
