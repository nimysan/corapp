const themeColor = '#FF3366';
const centerOfShenzhen = [116.397551, 39.906947];
const map = new AMap.Map('ncovMap', {
    //center: centerOfShenzhen,
    zoom: 12,
    viewMode: '2D',
    lang: 'zh_cn'
});
var currentMarker = null;
var oldMarkerGroup = null;
var oldMarekrOverlay = null;
const fullList = [];

//远程读取数据
$.get("/data", function(data) {
    for (var i = 0; i < data.length; i++) {
        fullList.push(data[i]);
    }
});

function loadUnlucky(datafile) {
    return; // instead of read data from remote 
    $.get(datafile, function(data) {
        // do something with your data
        for (var i = 0; i < data.length; i++) {
            var dist = data[i];
            if (dist.pois) {
                for (var p = 0; p < dist.pois.length; p++) {
                    fullList.push(dist.pois[p]);
                }
            }
        }
    });
}

loadUnlucky("gd.json");
loadUnlucky("ah.json");
loadUnlucky("bj.json");
loadUnlucky("fj.json");
loadUnlucky("hb.json");
loadUnlucky("hn.json");
loadUnlucky("js.json");
loadUnlucky("jx.json");
loadUnlucky("sc.json");
loadUnlucky("sd.json");
//loadUnlucky("ah.json");




/**
 * 查看感染小区列表与给定的列表之间的距离，默认距离为3公里之内
 */
function inMiles(p1, miles, list) {
    var meters = miles * 1000;
    var unlucky = [];
    for (var m in list) {
        var dist = list[m];
        var dis = AMap.GeometryUtil.distance(p1, dist.point.coordinates);
        if (dis <= meters) {
            //console.log("---- " + dis + " --- " + dist.name);
            unlucky.push(dist);
        } else {
            //console.log("lucky " + dis + " --- " + dist.name);
        }
    }
    return unlucky;
}


function inMileByServer(p1, callback) {
    $.get("/list?longitude=" + p1.lng + "&latitude=" + p1.lat, function(data) {
        callback(data);
    });
}

function paintUnlucks(map, tmp_data) {

    if (oldMarekrOverlay) { map.remove(oldMarekrOverlay); }
    if (oldMarkerGroup) { map.remove(oldMarkerGroup); }
    const markers = [];
    const overlays = [];
    //var tmp_data = [];

    tmp_data.forEach(d => {
        let overlay;
        if (d.geometry && d.geometry.type === 'Polygon') {
            overlay = new AMap.Polygon({ path: d.geometry.coordinates });
        } else if (d.geometry && d.geometry.type === 'LineString') {
            overlay = new AMap.Polyline({ path: d.geometry.coordinates });
        } else {
            overlay = new AMap.Circle({
                center: d.point.coordinates,
                radius: 50
            })
        }
        const marker = new AMap.Marker({
            position: d.point.coordinates,
            icon: new AMap.Icon({
                size: new AMap.Size(8, 8),
                image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAABGdBTUEAALGPC/xhBQAAAA5JREFUGBljYBgFoBAAAAEIAAGUnFwzAAAAAElFTkSuQmCC',
                imageSize: new AMap.Size(8, 8)
            }),
            offset: new AMap.Pixel(-4, -8),
        });
        const content = `<div class="poi-label" style="background-color:${themeColor}">${d.name}<i class="poi-label-arrow" style="border-color: ${themeColor};border-style: dashed;border-top-style: solid;border-left-color: transparent;border-right-color: transparent;"></i></div>`
        marker.setLabel({
            offset: new AMap.Pixel(0, 0),
            content,
            direction: 'top'
        });

        markers.push(marker);
        overlays.push(overlay);
    });

    const overlayGroup = new AMap.OverlayGroup(overlays);
    const markerGroup = new AMap.OverlayGroup(markers);

    overlayGroup.setOptions({
        borderWeight: 1,
        strokeColor: themeColor,
        lineJoin: 'round',
        fillColor: themeColor,
        fillOpacity: 0.4
    });

    map.add(overlayGroup);
    map.add(markerGroup);
    oldMarekrOverlay = overlayGroup;
    oldMarkerGroup = markerGroup;

    map.on('zoomend', function(e) {
        if (map.getZoom() <= 11) {
            markerGroup.hide();
        } else {
            markerGroup.show();
        }
    })
}


AMapUI.loadUI(['control/BasicControl', 'misc/PoiPicker'], function(BasicControl, PoiPicker) {

    var poiPicker = new PoiPicker({
        //city:'北京',
        input: 'pickerInput'
    });

    //初始化poiPicker
    poiPickerReady(poiPicker);
});

function poiPickerReady(poiPicker) {

    window.poiPicker = poiPicker;

    var marker = new AMap.Marker();

    var infoWindow = new AMap.InfoWindow({
        offset: new AMap.Pixel(0, -20)
    });

    //选取了某个POI
    poiPicker.on('poiPicked', function(poiResult) {

        var source = poiResult.source,
            poi = poiResult.item,
            info = {
                source: source,
                id: poi.id,
                name: poi.name,
                location: poi.location.toString(),
                address: poi.address
            };

        marker.setMap(map);
        //infoWindow.setMap(map);

        var markerCurrent = new AMap.Marker({
            position: poi.location, // 经纬度对象，也可以是经纬度构成的一维数组[116.39, 39.9]
            title: poi.name,
            //content: poi.name
        });
        marker.setPosition(poi.location);
        //infoWindow.setPosition(poi.location);

        //infoWindow.setContent('POI信息: <pre>' + JSON.stringify(info, null, 2) + '</pre>');
        //infoWindow.open(map, marker.getPosition());
        if (currentMarker) {
            map.remove(currentMarker);
        }
        map.add(markerCurrent);
        currentMarker = markerCurrent;

        //var unluckyNear = inMiles(poi.location, 3, fullList);
        //if (unluckyNear.length > 0) {
        //    paintUnlucks(map, unluckyNear);
        //}

        inMileByServer(poi.location, function(areas) {
            paintUnlucks(map, areas);
            map.setFitView();
        });

        //console.log("0000 " + unluckyNear);

        map.setFitView();
        markerCurrent.setAnimation('AMAP_ANIMATION_BOUNCE');
        //map.setCenter(marker.getPosition());
    });

    poiPicker.onCityReady(function() {
        poiPicker.suggest('铂涛大厦');
    });
}