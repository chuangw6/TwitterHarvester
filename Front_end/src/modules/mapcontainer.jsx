import React, {Component, useState} from 'react';
import ReactDOM from "react-dom";
import ReactDOMServer from 'react-dom/server';
import {Paper, Button} from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';
import Snackbar from '@material-ui/core/Snackbar';
import {Checkbox} from "@material-ui/core";
import 'chart.js'
import MarkerClusterer from 'node-js-marker-clusterer';
import Colorlegend from "./colorlegend";
import {stateCaseDate, suburbCaseDate, searchSuburb, searchState, searchState2} from "../modules/scale"

import {colorOnConfirmed} from '../methods/defineColor'
import {dayFromStr, monthFromStr, dayFromValue, strFromDate} from '../methods/DateTransfer'

import Piechart from './piechart'

import mapStyles from '../resources/mapstyle.json';
import InnerMap from './innermap';
import * as location from './location'
import hospital_marker from '../resources/hospital_marker.png'
import school_marker from '../resources/school_marker.png'
import toiletpaper_marker from '../resources/toiletpaper_marker.png'
import discrimination_marker from '../resources/discrimination_marker.png'

import {searchState3} from './scale'
import {withStyles, makeStyles} from '@material-ui/core/styles';
import Slider from '@material-ui/core/Slider';
import Typography from '@material-ui/core/Typography';


const styles = theme => ({
    map: {
        width: '100%',
        height: '100%'
    },
    mapContainer: {
        width: "100%",
        height: "900px",
        boxShadow: "0 2px 8px 0 #d7d7d7"
    },
    searchPanel: {
        display: 'flex',
        flexWrap: 'wrap',

        '& > *': {
            margin: theme.spacing(1),
            width: theme.spacing(300),
            height: theme.spacing(16),
        },
        width: theme.spacing(50),
        height: theme.spacing(100),
        position: 'fixed',
        top: '30%',
        left: '60%',
    },
    heading: {
        fontSize: theme.typography.pxToRem(15),
    },
    secondaryHeading: {
        fontSize: theme.typography.pxToRem(15),
        color: theme.palette.text.secondary,
    },
    icon: {
        verticalAlign: 'bottom',
        height: 20,
        width: 20,
    },
    details: {
        alignItems: 'center',
    },
    column: {
        flexBasis: '50.00%',
    },
    helper: {
        borderLeft: `2px solid ${theme.palette.divider}`,
        padding: theme.spacing(1, 2),
    },
    link: {
        color: theme.palette.primary.main,
        textDecoration: 'none',
        '&:hover': {
            textDecoration: 'underline',
        },
    },
    input: {
        marginLeft: theme.spacing(1),
        flex: 1,
    },
    iconButton: {
        padding: 10,
    },
    divider: {
        height: 28,
        margin: 4,
    },
})

//1.20 人传人确定 1.23 武汉封城 1.31 global emergency declared 2.1澳洲禁止中国 3.7 toilet paper 3.11 europe new epiccentre
//3.15 aus 14-day qarantine for oversea returners 3.20 australia lockdown 3.23 aus cafes shutdown  3.30 victoria stage 3
//5.13 stage 3 eased
const keyDates = [
    {value: 18, info: "human-to-human transmission confirmed"},
    {value: 24, info: "Wuhan lockdown started"},
    {value: 28, info: "global emergency declared"},
    {value: 35, info: "travel ban issued for Chinese nationals"},
    {value: 64, info: "toilet paper crisis in Australia"},
    {value: 72, info: "Europe became new epicentre"},
    {value: 79, info: "14-day quarantine needed for returners from overseas"},
    {value: 84, info: "Australia closed its borders"},
    {value: 86, info: "cafes shutdown"},
    {value: 93, info: "stage 3 restrictions in place in Victoria"},
    {value: 120, info: "restrictions lifted in Victoria"},
];

const marks = [
    {
        value: 0,
        label: '01/01',
    },
    {
        value: 28,
        label: '29/01',
    },
    {
        value: 59,
        label: '29/02',
    },
    {
        value: 88,
        label: '29/03',
    },
    {
        value: 121,
        label: '01/05',
    },
    {
        value: 133,
        label: '13/05',
    }
];
const AirbnbSlider = withStyles({
    root: {
        color: 'primary',
        height: 8,
    },
    thumb: {
        height: 27,
        width: 27,
        backgroundColor: '#fff',
        border: '1px solid currentColor',
        marginTop: -12,
        marginLeft: -13,
        boxShadow: '#ebebeb 0px 2px 2px',
        '&:focus, &:hover, &$active': {
            boxShadow: '#ccc 0px 2px 2px 1px',
        },
        '& .bar': {
            // display: inline-block !important;
            height: 9,
            width: 1,
            backgroundColor: 'currentColor',
            marginLeft: 1,
            marginRight: 1,
        },
    },
    active: {},
    track: {
        height: 8,
        //borderRadius: 4,
    },
    rail: {
        height: 8,
        borderRadius: 4,
    },
    markLabel: {
        color: 'grey'
    },
    markLabelActive: {
        color: '#fff'
    },
    valueLabel: {
        left: 'calc(-50% + 4px)',
    },
})(Slider);

function valuetext(value) {
    return `Date: ${value}`;
}

function AirbnbThumbComponent(props) {
    return (
        <span {...props}>
      <span className="bar"/>
      <span className="bar"/>
    </span>
    );
}

function Alert(props) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
}

class MapContainer extends Component {

    constructor(props) {
        super(props);
        this.state = {
            dateInfo: {
                month: 1,
                week: 1,
                day: 1,
                str:''
            },
            emotionInfo: {
                positive: 0,
                middle: 0,
                negative: 0
            },
            locationInfo: {
                state: '',
                suburb: 'BALLARAT'
            },

            pieAxis: [],
            pieData: [],
            pie2Data: [],
            pie2Axis: [],

            showKeyDate: false,
            keyDateText: '',
            hospital_location: [],
            school_location: [],
            hospitals: [],
            schools: [],
            toiletpapers: [],
            discriminations: [],
            cities: [],
            scale: 'state',
            showHospital: false,
            showSchool: false,
            showHotTopic: false,
            clearStyle: false,
            loaded: false,
            map: null,
            bottom: '100px',
            left: '20px',
            show: 'flex',
            cases: 0,
            emitonType: {
                happy: 5,
                sad: 7,
                angry: 8,
                fear: 2,
            },
            setOpen: false,
            opacity: '30%',
            level: 3,
            searchText: '',
        };
        this.initBorder = this.initBorder.bind(this)
        this.changeBorder = this.changeBorder.bind(this);
        this.initHospitalMarkers = this.initHospitalMarkers.bind(this);
        this.initSchoolMarkers = this.initSchoolMarkers.bind(this);
        this.initHotTopicMarkers = this.initHotTopicMarkers.bind(this);
    }

    handleLevel = (event) => {
        this.setState({level: event.target.value});
    }

    handleSearchText = (event) => {
        this.setState({searchText: event.target.value});
    }

    focusSearchArea = () => {
        let text = this.state.searchText;
        //todo: auto focus
    }

    onHoverSearch = () => {
        this.setState({opacity: '100%'});
    }

    onLeaveSearch = () => {
        this.setState({opacity: '30%'});
    }

    handleClick = () => {
        this.setState({setOpen: true});
    };

    handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        this.setState({setOpen: false});
        this.setState({showKeyDate: false});
    };

    initBorder(map) {

        const that = this;

        //map.data.loadGeoJson('https://raw.githubusercontent.com/rowanhogan/australian-states/master/states.geojson')

        // map.data.loadGeoJson('https://api.jsonbin.io/b/5eab07bf07d49135ba485cfa/5')
        map.data.loadGeoJson('https://data.gov.au/geoserver/vic-state-boundary-psma-administrative-boundaries/wfs?request=GetFeature&typeName=ckan_b90c2a19_d978_4e14_bb15_1114b46464fb&outputFormat=json')
        map.data.loadGeoJson('https://data.gov.au/geoserver/nsw-state-boundary/wfs?request=GetFeature&typeName=ckan_a1b278b1_59ef_4dea_8468_50eb09967f18&outputFormat=json')
        map.data.loadGeoJson('https://data.gov.au/geoserver/qld-state-boundary-psma-administrative-boundaries/wfs?request=GetFeature&typeName=ckan_2dbbec1a_99a2_4ee5_8806_53bc41d038a7&outputFormat=json')
        map.data.loadGeoJson('https://data.gov.au/geoserver/act-state-boundary-psma-administrative-boundaries/wfs?request=GetFeature&typeName=ckan_83468f0c_313d_4354_9592_289554eb2dc9&outputFormat=json')
        map.data.loadGeoJson('https://data.gov.au/geoserver/wa-state-boundary-psma-administrative-boundaries/wfs?request=GetFeature&typeName=ckan_5c00d495_21ba_452d_ae46_1ad0ca05e41f&outputFormat=json')
        map.data.loadGeoJson('https://data.gov.au/geoserver/tas-state-boundary/wfs?request=GetFeature&typeName=ckan_cf2ebc53_1633_4c5c_b892_bfc3945d913b&outputFormat=json')
        map.data.loadGeoJson('https://data.gov.au/geoserver/sa-state-boundary-psma-administrative-boundaries/wfs?request=GetFeature&typeName=ckan_8f996b8c_d939_4757_a231_3fec8cb8e929&outputFormat=json')
        map.data.loadGeoJson('https://data.gov.au/geoserver/nt-state-boundary-psma-administrative-boundaries/wfs?request=GetFeature&typeName=ckan_5162e11c_3259_4894_8b9e_f44540b6cb11&outputFormat=json')

        map.data.addListener('mouseover', function (event) {
            map.data.overrideStyle(event.feature, {
                fillColor: '#ff8a80',
                strokeWeight: 8,
                fillOpacity: 0.6
            });
            if(that.state.scale==='state'&& map.zoom>5 && (map.getCenter().lat()>-40&&map.getCenter().lat()<-30)&&(map.getCenter().lng()>135&&map.getCenter().lng()<150)) {
                map.data.setStyle({})
                that.setState({scale:'suburb'})
                map.data.loadGeoJson('https://data.gov.au/geoserver/vic-local-government-areas-psma-administrative-boundaries/wfs?request=GetFeature&typeName=ckan_bdf92691_c6fe_42b9_a0e2_a4cd716fa811&outputFormat=json')
                that.setState({show:"none"});
            }

            that.setState({
                locationInfo: {
                    state: searchState3.get(event.feature.getProperty('state_pid')),
                    suburb: event.feature.getProperty('vic_lga__3')
                }
            })

            var cases = 0

            if (that.state.scale === 'state') {
                try {
                    var day = that.props.statecases[that.state.dateInfo.str]
                    day.map(
                        (t) => {
                            if (t.state === searchState3.get(event.feature.getProperty('state_pid')))
                                cases = t.cases
                        }
                    )
                } catch (e) {
                    console.log(e)
                }
            } else {
                try {
                    var day = that.props.suburbcases[that.state.dateInfo.str]
                    day.map(
                        (t) => {
                            if (t.Suburb === event.feature.getProperty('vic_lga__3'))
                                cases = t.cases
                        }
                    )
                } catch (e) {
                    console.log(e)
                }
            }

            that.setState({cases: cases})
        });


            map.data.addListener('mouseout', function () {
                map.data.revertStyle();
                that.setState({show: "none"});
            });

            map.data.addListener('click', function (event) {

                console.log("month" + that.state.dateInfo.month + "day" + that.state.dateInfo.day)

                console.log("zoom:" + map.getZoom())
                console.log("lat" + map.getCenter().lat())
                console.log("lng" + map.getCenter().lng())

                var latBound = map.getBounds().getNorthEast().lat() - map.getBounds().getSouthWest().lat()
                var latLocation = event.latLng.lat() - map.getBounds().getSouthWest().lat()
                var bottom = latLocation / latBound * 1000 - 40 + "px"
                that.setState({bottom: bottom})
                console.log(bottom)

                var lngBound = map.getBounds().getNorthEast().lng() - map.getBounds().getSouthWest().lng()
                console.log("lngBound " + lngBound)
                var lngLocation = event.latLng.lng() - map.getBounds().getSouthWest().lng()
                console.log("lngLocation " + lngLocation)
                var left = lngLocation / lngBound * 1000 + 10 + "px"
                that.setState({left: left})
                console.log(left)


                try {

                    var name = that.state.locationInfo.suburb
                    var low = name.toLowerCase()
                    var date = strFromDate(that.state.dateInfo.month, that.state.dateInfo.day)

                    console.log("try print topic name " + low)
                    console.log("try print topic name " + date)

                    console.log("print a topic example" + that.props.suburbtopic[date][low][0].word)

                    var topic = that.props.suburbtopic[date][low]
                    var emotion = that.props.suburbemtion[date][low]

                } catch (e) {
                    console.log(e)
                }
                try {
                    that.state.pieAxis.length = 0
                    that.state.pieData.length = 0

                    topic.map(
                        (t, index) => {
                            if (index < 10) {
                                that.setState({pieAxis: [...that.state.pieAxis, t.word]})
                                that.setState({pieData: [...that.state.pieData, t.num]})
                            }
                        }
                    )
                } catch (e) {
                    console.log(e)
                }


                try {
                    that.state.pie2Axis.length = 0
                    that.state.pie2Data.length = 0

                    var pie2Data = [0, 0, 0]
                    emotion.map(
                        (t) => {
                            if (t.emotion === 'positive')
                                pie2Data[0] += 1
                            else if (t.emotion === 'middle')
                                pie2Data[1] += 1
                            else if (t.emotion === 'negative')
                                pie2Data[2] += 1
                        }
                    )
                    if (pie2Data[0] + pie2Data[1] + pie2Data[2] > 0) {
                        that.setState({pie2Axis: ['positive', 'middle', 'negative']})
                        that.setState({pie2Data: pie2Data})
                    }
                } catch (e) {
                    console.log(e)
                }

            });

            this.changeBorder(map)
            // this.setState({map:map})
        }

    changeBorder(map) {

        const that = this;

        map.data.setStyle(function (feature) {

            var cases = 0
            if (that.state.scale === 'state') {

                try {
                    var day = that.props.statecases[that.state.dateInfo.str]
                    day.map(
                        (t) => {
                            if (t.state === searchState3.get(feature.getProperty('state_pid')))
                               cases=t.cases
                        }
                    )
                } catch (e) {
                    console.log(e)
                }

            } else if (that.state.scale === 'suburb') {

                try {
                    var day = that.props.suburbcases[that.state.dateInfo.str]
                    day.map(
                        (t) => {
                            if (t.Suburb === feature.getProperty('vic_lga__3'))
                                cases=t.cases
                        }
                    )
                } catch (e) {
                    console.log(e)
                }
            }

            let color = colorOnConfirmed(cases);

            return {
                fillColor: color,
                strokeWeight: 0.3,
                strokeOpacity: 0.3,
                fillOpacity: 0.4,
            };
        });

        this.setState({map: map})

    }

    initCitiesMarkers(map) {

        location.cities.map(city => {
            this.state.cities.push(new window.google.maps.Marker({
                position: city,
                map: map,
            }))
        })
        this.state.map = map;

    }

    initHotTopicMarkers(map) {

        location.toiletpapers.map(toiletpaper => {
            this.state.toiletpapers.push(new window.google.maps.Marker({
                position: toiletpaper,
                map: map,
                animation: window.google.maps.Animation.BOUNCE,
                icon: toiletpaper_marker
            }))
        })
        this.state.map = map
        location.discriminations.map(discrimination => {
            this.state.discriminations.push(new window.google.maps.Marker({
                position: discrimination,
                map: map,
                animation: window.google.maps.Animation.BOUNCE,
                icon: discrimination_marker
            }))
        })
        this.state.map = map
    }

    initHospitalMarkers(map) {

        location.hospitals.map(hospital => {
            this.state.hospitals.push(new window.google.maps.Marker({
                position: hospital,
                map: map,
                icon: hospital_marker
            }))
        })
        this.state.map = map;

        var markerCluster = new MarkerClusterer(map, this.state.hospitals, {
                styles: [{
                    width: 16,
                    height: 16,
                    url: 'https://i.imgur.com/pZcCLJn.png',
                }],
            },
        );

        this.state.map = map;

    }

    initSchoolMarkers(map) {
        location.schools.map(school => {
            this.state.schools.push(new window.google.maps.Marker({
                position: school,
                map: map,
                icon: school_marker
            }))
        })
        this.state.map = map;

        var markerCluster = new MarkerClusterer(map, this.state.schools, {
                styles: [{
                    width: 16,
                    height: 16,
                    url: 'https://i.imgur.com/SvmeGSC.png',
                }],
            },
        );

        this.state.map = map;

    }

    DateChange = (event, value) => {

        this.setState({
            dateInfo: {
                month: Math.floor(value / 30) + 1,
                week: Math.floor(value / 7) + 1,
                day: dayFromValue(value),
                str: strFromDate(Math.floor(value / 30) + 1, dayFromValue(value))
            }
        });

        for (let day = 0; day < keyDates.length; day++) {
            if (keyDates[day].value === value) {
                this.handleClick();
                this.setState({showKeyDate: true, keyDateText: keyDates[day].info})
            }
        }
        if (this.state.showHotTopic)
            this.initHotTopicMarkers(this.state.map);

        this.changeBorder(this.state.map)

        /*        if (value === 4)
                        this.state.toiletpapers.map(toiletpaper => toiletpaper.setMap(null))
                else if (value === 3)
                        this.state.discriminations.map(discrimination => discrimination.setMap(null))
                   else if (value === 1 || value === 2)
                    {
                        this.state.toiletpapers.map(toiletpaper => toiletpaper.setMap(null))
                        this.state.discriminations.map(discrimination => discrimination.setMap(null))
                    }*/

    };

    styleChange = (event) => {
        if (this.state.clearStyle)
            this.setState({clearStyle: false})
        else
            this.setState({clearStyle: true})
        if (event.target.checked) {
            this.state.map.data.setStyle({})
        }

    }

    HospitalCheckboxChange = (event) => {

        if (this.state.showHospital)
            this.setState({showHospital: false});
        else
            this.setState({showHospital: true});
        if (event.target.checked)
            this.initHospitalMarkers(this.state.map);
        else
            this.state.hospitals.map(hospital => hospital.setMap(null))

    };

    SchoolCheckboxChange = (event) => {

        if (this.state.showSchool)
            this.setState({showSchool: false});
        else
            this.setState({showSchool: true});
        if (event.target.checked)
            this.initSchoolMarkers(this.state.map);
        else
            this.state.schools.map(school => school.setMap(null))

    };

    HotTopicCheckboxChange = (event) => {

        if (this.state.showHotTopic)
            this.setState({showHotTopic: false});
        else
            this.setState({showHotTopic: true});
        if (event.target.checked) {
            if (this.state.month === 3 || this.state.month === 4)
                this.initHotTopicMarkers(this.state.map);
            if (this.state.month === 3)
                this.state.discriminations.map(discrimination => discrimination.setMap(null))
            else if (this.state.month === 4)
                this.state.toiletpapers.map(toiletpaper => toiletpaper.setMap(null))
        } else {
            this.state.toiletpapers.map(toiletpaper => toiletpaper.setMap(null))
            this.state.discriminations.map(discrimination => discrimination.setMap(null))
        }
        console.log("toilet paper" + this.state.toiletpapers)

    };

    render() {
        const {classes} = this.props;

        //if(this.state.loaded===true)

        return (
            <div>
                <div className={classes.mapContainer}>
                    < InnerMap id="map"
                               options={{center: {lat: -25.5, lng: 132.5}, zoom: 5, styles: mapStyles}}
                               onMapLoad={(map) => this.initBorder(map)
                               } changeBorder={this.changeBorder}/>

                </div>
                {/*                <div className={classes.searchPanel} style={{opacity: this.state.opacity}} onMouseOver={this.onHoverSearch} onMouseLeave={this.onLeaveSearch}>
                    <Paper elevation={3} >
                        <ExpansionPanel>
                            <ExpansionPanelSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1c-content"
                                id="panel1c-header"
                            >
                                <div className={classes.column}>
                                    <Typography className={classes.heading}>Search</Typography>
                                </div>
                                <div className={classes.column}>
                                    <Typography className={classes.secondaryHeading}>Expand</Typography>
                                </div>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails className={classes.details}>
                                <div style={{flex: 2}}>
                                    <FormControl component="fieldset">
                                        <InputLabel id="demo-simple-select-label">Level</InputLabel>
                                        <Select
                                            labelId="demo-simple-select-label"
                                            id="demo-simple-select"
                                            value={this.state.level}
                                            onChange={this.handleLevel}
                                        >
                                            <MenuItem value={1}>State</MenuItem>
                                            <MenuItem value={2}>City</MenuItem>
                                            <MenuItem value={3}>Suburb</MenuItem>
                                        </Select>
                                    </FormControl>

                                </div>
                                <div style={{flex: 5}}>
                                    <FormControl component="fieldset">
                                        <div style={{flexDirection: 'row'}}>
                                            <InputBase
                                                className={classes.input}
                                                placeholder="Enter location name"
                                                inputProps={{ 'aria-label': 'search location' }}
                                                onChange={this.handleSearchText}
                                            />

                                        </div>
                                    </FormControl>
                                </div>
                            </ExpansionPanelDetails>
                            <Divider />
                            <ExpansionPanelActions>
                                <Button size="small">Cancel</Button>
                                <IconButton type="submit" className={classes.iconButton} aria-label="search" onClick={this.focusSearchArea}>
                                    <SearchIcon />
                                </IconButton>
                            </ExpansionPanelActions>
                        </ExpansionPanel>
                    </Paper>
                </div>*/}
                {/*                          <div style={{display:'flex', position: 'absolute',bottom: '220px', left: '20px'}}>
                                <Checkbox
                                    checked={this.state.clearStyle}
                                    onChange={this.styleChange}
                                />
                                <p style={{color:'#FFFFFF'}}>
                                    Covid cases
                                </p>
                            </div>*/}

                {/*                            <div style={{display:'flex', position: 'absolute',bottom: '180px', left: '20px'}}>
                                <Checkbox
                                    checked={this.state.showHotTopic}
                                    onChange={this.HotTopicCheckboxChange}
                                />
                                <p style={{color:'#FFFFFF'}}>
                                    HotTopic
                                </p>
                            </div>

                            <div style={{display:'flex', position: 'absolute',bottom: '140px', left: '20px'}}>
                                <Checkbox
                                    checked={this.state.showHospital}
                                    onChange={this.HospitalCheckboxChange}
                                />
                                <p style={{color:'#FFFFFF'}}>
                                    Hospital
                                </p>
                            </div>

                            <div style={{display:'flex', position: 'absolute',bottom: '100px', left: '20px'}}>
                                <Checkbox
                                    checked={this.state.showSchool}
                                    onChange={this.SchoolCheckboxChange}
                                />
                                <p style={{color:'#FFFFFF'}}>
                                    School
                                </p>
                            </div>*/}

                {/*
                            <div style={{width:"150px", height:"50px", display:this.state.show,position: 'absolute',bottom:this.state.bottom, left: this.state.left}}>
*/}
                <div style={{position: 'absolute', top: '150px', left: '200px'}}>

                    {this.state.scale === 'state' &&
                    <p style={{color:'#FFFFFF'}}>state: {this.state.locationInfo.state}</p>}
                    {this.state.scale === 'suburb' &&
                     <p style={{color:'#FFFFFF'}}>suburb: {this.state.locationInfo.suburb+"  "}</p>}

                     <p style={{color:'#FFFFFF'}}>
                     cases: {this.state.cases+" "}</p>


                    <Piechart pieAxis={this.state.pieAxis} pieData={this.state.pieData}/>

                    <Piechart pieAxis={this.state.pie2Axis} pieData={this.state.pie2Data}/>


                </div>
                <div style={{display: 'flex', position: 'absolute', bottom: '80px', right: '90px'}}>
                    <Colorlegend/>
                </div>


                {/* <FormControl>
                                <InputLabel shrink id="demo-simple-select-placeholder-label-label">
                                    Area
                                </InputLabel>
                                <Select
                                    labelId="demo-simple-select-placeholder-label-label"
                                    id="demo-simple-select-placeholder-label"
                                    value={area}
                                    onChange={handleSelectChange}
                                    displayEmpty
                                    className={classes.selectEmpty}
                                >
                                    <MenuItem value="">
                                        <em>State</em>
                                    </MenuItem>
                                    <MenuItem value={10}>Suburb</MenuItem>
                                    <MenuItem value={20}>Cities</MenuItem>
                                </Select>
                                <FormHelperText>Area Select</FormHelperText>
                            </FormControl>*/}


                <div style={{position: 'absolute', bottom: '60px', left: '30px', width: '700px'}}>

                    <Typography style={{color: '#FFFFFF'}}>
                        Day/Month   {"  "+this.state.dateInfo.day}/{this.state.dateInfo.month}
                    </Typography>

                    <AirbnbSlider
                        getAriaValueText={valuetext}
                        aria-labelledby="discrete-slider-always"
                        ThumbComponent={AirbnbThumbComponent}
                        marks={marks}
                        defaultValue={0}
                        valueLabelDisplay="on"
                        onChange={this.DateChange}
                        max={152}
                    />

                    <div style={{
                        backgroundColor: '#fff'
                    }}>
                        <Snackbar open={this.state.setOpen} autoHideDuration={6000} onClose={this.handleClose}>
                            <Alert onClose={this.handleClose} severity="warning">
                                {this.state.keyDateText}
                            </Alert>
                        </Snackbar>
                    </div>
                </div>


            </div>
        )
    }
}

export default withStyles(styles)(MapContainer);