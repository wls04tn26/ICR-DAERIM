﻿"use strict";
var progressId; // 프로그레스바 변수
var labels;

$(function () {
    _init();
});

// 초기화
function _init() {
    $('.um_select select').stbDropdown(); // 검색 메뉴 드랍 초기화
    $('.batch_tbl_right_divBodyScroll').scrollTop(0).scrollLeft(0); // 스크롤 초기화
    datePickerEvent(); // datePicker 적용
    clickEventHandlers();
    selectDocTopType(); // 대메뉴 조회(docTopType)
}

// 버튼 이벤트 핸들러 함수 모음
function clickEventHandlers() {
    selectBtnClick(); // 조회 버튼
    btnRetrainClick(); // 재학습 버튼
    btnSendClick(); // 전송 버튼
}

// 문서양식 조회 및 select box 렌더링
function selectDocTopType() {
    $.ajax({
        url: '/docManagement/selectDocTopType',
        type: 'post',
        datatype: 'json',
        data: null,
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            $('#progressMsgTitle').html("초기화 중..");
            progressId = showProgressBar();
        },
        success: function (data) {
            if (!data.error) {
                var optionHTML = '';
                for (var i in data.docToptypeList) {
                    optionHTML += '<option value="' + data.docToptypeList[i].SEQNUM + '">' + data.docToptypeList[i].KORNM + '</option>';
                }
                $('#docTopTypeSelect').append(optionHTML);
                if (data.docToptypeList.length > 0) { // 문서 topType이 있으면 첫번째 인덱스 topType 문서 조회
                    $('#docTopTypeSelect').prev().text(data.docToptypeList[0].KORNM);
                    var params = {
                        'docTopType': data.docToptypeList[0].SEQNUM,
                        'startDate': $('#searchStartDate').val(),
                        'endDate': $('#searchEndDate').val(),
                        'processState': $('#processStateSelect').val()
                    };

                    selectBatchPoMlExport(params, true);
                }
            } else {
                fn_alert('alert', 'ERROR');
                endProgressBar(progressId);
            }
        },
        error: function (err) {
            console.log(err);
            fn_alert('alert', 'ERROR');
            endProgressBar(progressId);
        }
    });
}

// 시작 및 종료날짜 datepicker 이벤트
function datePickerEvent() {
    //datepicker 한국어로 사용하기 위한 언어설정
    $.datepicker.setDefaults($.datepicker.regional['ko']);

    // Datepicker
    $(".datepicker").datepicker({
        showButtonPanel: true,
        dateFormat: "yy-mm-dd",
        onClose: function (selectedDate) {

            var eleId = $(this).attr("id");
            var optionName = "";

            if (eleId.indexOf("StartDate") > 0) {
                eleId = eleId.replace("StartDate", "EndDate");
                optionName = "minDate";
            } else {
                eleId = eleId.replace("EndDate", "StartDate");
                optionName = "maxDate";
            }

            $("#" + eleId).datepicker("option", optionName, selectedDate);
            $(".searchDate").find(".chkbox2").removeClass("on");
        }
    });
    $(".searchDate").schDate();

    // 30일전 날짜 구하기 (searchStartDate)
    var today = new Date();
    var oldday = new Date(today - (3600000 * 24 * 30));
    var oldMonth = ((oldday.getMonth() + 1) < 10 ? '0' : '') + (oldday.getMonth() + 1);
    var oldDate = ((oldday.getDate()) < 10 ? '0' : '') + oldday.getDate();
    $("#searchStartDate").val(oldday.getFullYear() + '-' + oldMonth + '-' + oldDate);

    // 오늘날짜 구하기 (searchEndDate)
    var endDate = getNowDate("-");
    $("#searchEndDate").val(endDate);
};

// 문서 조회 버튼 click 이벤트
function selectBtnClick() {
    $('#btn_search').click(function () {
        var docTopType = $('#docTopTypeSelect').val();
        var startDate = $('#searchStartDate').val();
        var endDate = $('#searchEndDate').val();
        var processState = $('#processStateSelect').val();

        var params = {
            'docTopType': docTopType,
            'startDate': startDate,
            'endDate': endDate,
            'processState': processState
        };
        selectBatchPoMlExport(params, false);
    });
}

// 문서양식 데이터 조회 이벤트
function selectBatchPoMlExport(params, isInit) {
    
    $.ajax({
        url: '/docManagement/selectBatchPoMlExport',
        type: 'post',
        datatype: 'json',
        data: JSON.stringify(params),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            $('#progressMsgTitle').html("문서데이터 조회중...");
            if (!isInit) progressId = showProgressBar();
        },
        success: function (data) {
            console.log(data);
            if (!data.error) {
                labels = data.docLabelList;
                appendDocTableHeader(data.docLabelList); // 문서조회 table html 렌더링
                checkAllBoxClick(); // all 체크박스 background css 적용
                appendMLData(data.docLabelList, data.docDataList);
                $('#paging').html(appendPaging((params.pagingCount) ? params.pagingCount : 1, data.totCount)); // 페이징 html 렌더링
                btnPagingClick(); // 페이징 버튼 이벤트 적용
                checkBoxClick(); // 체크박스 background css 적용
                endProgressBar(progressId);
            } else {
                fn_alert('alert', 'ERROR');
                endProgressBar(progressId);
            }
        },
        error: function (err) {
            console.log(err);
            fn_alert('alert', 'ERROR');
            endProgressBar(progressId);
        }
    });
}

// 문서양식에 따른 table 헤더 렌더링
function appendDocTableHeader(docLabelList) {
    $('#docTableColumn').empty();
    $('#docMlDataColGroup').empty();

    var headerColGroupHTML = '<colgroup>' +
	    '<col style="width:50px;">' +
        '<col style="width:270px;">' +
        '<col style="width:150px;">';
    var headerTheadHTML = '<thead>';
    headerTheadHTML += '<tr>';
    headerTheadHTML += '<th scope="row"><div class="checkbox-options mauto"><input type="checkbox" class="sta00_all" value="" id="listCheckAll" name="listCheckAll_before" /></div></th>';
    headerTheadHTML += '<th scope="row">파일명</th>';
    headerTheadHTML += '<th scope="row">날짜</th>';

    for (var i in docLabelList) {
        headerColGroupHTML += '<col style="width:180px;">';
        headerTheadHTML += '<th scope="row">' + docLabelList[i].KORNM + '</th>';
    }
    headerColGroupHTML += '</colgroup>';
    headerTheadHTML += '</tr>';
    headerTheadHTML += '</thead>';

    $('#docTableColumn').append(headerColGroupHTML + headerTheadHTML); // 문서관리 조회 table header html
    $('#docMlDataColGroup').append(headerColGroupHTML.replace('<colgroup>', '').replace('</colgroup>', '')); // 문서관리 조회 table body html

    // 헤더 체크박스 클릭 이벤트
    $('#listCheckAll').click(function () {
        if ($(this).is(":checked")) {
            $('input[name="listCheck"]').prop('checked', true);
        } else {
            $('input[name="listCheck"]').prop('checked', false);
        }
    });
}

// ML 데이터 table 렌더링
function appendMLData(docLabelList, docDataList) {
    $('#tbody_docList').empty();
    var docTopType = $('#docTopTypeSelect').val();

    var totalHTML = '';
    if (docTopType == 51) { // 일반송장
        appendMultiHTML(docLabelList, docDataList);
    } else {
        totalHTML = appendSingleHTML(docDataList);
        $('#tbody_docList').append(totalHTML);
    }
}

// 싱글 entry HTML 렌더링
function appendSingleHTML(docDataList) {
    var returnHTML = '';
    for (var i in docDataList) {
        var mlDataListHTML = '' +
            '<tr class="originalTr">' +
            '<td><div class="checkbox-options mauto"><input type="hidden" value="' + docDataList[i].SEQ + '" name="seq" /><input type="checkbox" class="sta00_all" value="" name="listCheck" /></div></td>' +
            '<td>' +
            '<a href="#" title="양식" onclick="openImagePop(\'' + docDataList[i].FILENAME + '\')">' +
            '<input type="text" value="' + docDataList[i].FILENAME.substring(docDataList[i].FILENAME.lastIndexOf('/') + 1) + '" class="inputst_box03_15radius" data-originalvalue="' + docDataList[i].FILENAME + '" disabled>' +
            '</a>' +
            '</td>' +
            '<td><input type="text" value="' + docDataList[i].AUTOSENDTIME + '" class="inputst_box03_15radius" data-originalvalue="' + docDataList[i].AUTOSENDTIME + '" disabled></td>';
        var items = docDataList[i].EXPORTDATA;
        items = items.replace(/\"/gi, '').slice(1, -1);
        items = items.split(',');
        for (var j in items) {
            if (items[j] == 'null') {
                mlDataListHTML += '<td><input type="text" value="" class="inputst_box03_15radius" data-originalvalue=""></td>';
            } else {
                var textVal = (items[j].split('::')[1]) ? items[j].split('::')[1] : items[j];
                mlDataListHTML += '<td><input type="text" value="' + textVal + '" class="inputst_box03_15radius" data-originalvalue="' + items[j] + '"></td>';
            }
        }
        mlDataListHTML += '</tr>';
        returnHTML += mlDataListHTML;
    }

    return returnHTML;
}

// 멀티 entry HTML 렌더링
function appendMultiHTML(docLabelList, docDataList) {   
    var multiLabelNumArr = [];
    var multiLabelYLocArr = [];

    // Multi Label 순서 구하기
    for (var i in docLabelList) {
        if (docLabelList[i].AMOUNT == "multi") multiLabelNumArr.push(i);
    }

    for (var i in docDataList) {
        // 가장 많은 multi entry의 y축 좌표값 구하기
        var multiEntryInfo = getMultiLabelYLoc(docDataList[i].EXPORTDATA, multiLabelNumArr);
        multiLabelYLocArr = multiEntryInfo.dataArr;

        for (var k = 0; k < multiEntryInfo.dataCount; k++) {
            var mlDataListHTML;

            // 첫 row만 파일명, 날짜 표시
            if (k == 0) {
                mlDataListHTML = '' +
                    '<tr class="originalTr">' +
                    '<td><div class="checkbox-options mauto"><input type="hidden" value="' + docDataList[i].SEQ + '" name="seq" /><input type="checkbox" class="sta00_all" value="" name="listCheck" /></div></td>' +
                    '<td>' +
                    '<a href="#" title="양식" onclick="openImagePop(\'' + docDataList[i].FILENAME + '\')">' +
                    '<input type="text" value="' + docDataList[i].FILENAME.substring(docDataList[i].FILENAME.lastIndexOf('/') + 1) + '" class="inputst_box03_15radius" data-originalvalue="' + docDataList[i].FILENAME + '" disabled>' +
                    '</a>' +
                    '</td>' +
                    '<td><input type="text" value="' + docDataList[i].AUTOSENDTIME + '" class="inputst_box03_15radius" data-originalvalue="' + docDataList[i].AUTOSENDTIME + '" disabled></td>';
            } else {
                mlDataListHTML = '' +
                    '<tr class="multiTr_' + docDataList[i].SEQ + '">' +
                    '<td></td>' +
                    '<td>' +
                    '</td>' +
                    '<td></td>';
            }
            var items = docDataList[i].EXPORTDATA;
            items = items.replace(/\"/gi, '').slice(1, -1);
            items = items.split(',');

            for (var j in items) {               
                if (items[j] == 'null') { // entry 값 없음
                    mlDataListHTML += '<td><input type="text" value="" class="inputst_box03_15radius" data-originalvalue=""></td>';

                } else if (multiLabelNumArr.indexOf(j) != -1 && items[j].split('::')[1]) { // 멀티엔트리

                    var yLoc = Number(multiLabelYLocArr[k].yLoc);
                    if (items[j].split(' | ')[k]) {
                        if (Math.abs(Number(items[j].split(' | ')[k].split('::')[0]) - yLoc) < 20) {
                            var textVal = items[j].split(' | ')[k].split('::')[1];
                            mlDataListHTML += '<td><input type="text" value="' + textVal + '" class="inputst_box03_15radius" data-originalvalue="' + textVal + '"></td>';
                        } else {
                            var textVal = items[j].split(' | ')[k].split('::')[1];
                            mlDataListHTML += '<td><input type="text" value="' + textVal + '" class="inputst_box03_15radius" data-originalvalue="' + textVal + '"></td>';
                        }
                    } else {
                        mlDataListHTML += '<td><input type="text" value="" class="inputst_box03_15radius" data-originalvalue=""></td>';
                    }
                } else { // 싱글엔트리

                    var textVal = '';
                    var itemArr = items[j].split(' | ');
                    for (var m in itemArr) {
                        textVal += (itemArr[m].split('::')[1]) ? itemArr[m].split('::')[1] : itemArr[m] + ((m == 0) ? '' : ' | ');
                    }
                    mlDataListHTML += '<td><input type="text" value="' + textVal + '" class="inputst_box03_15radius" data-originalvalue="' + items[j] + '"></td>';       
                }
            }
            mlDataListHTML += '</tr>';
            $('#tbody_docList').append(mlDataListHTML);
        }
    }    

    return null;
}

// 가장 많은 multi entry의 y축 좌표값 구하기
function getMultiLabelYLoc(exportData, multiLabelNumArr) {
    var returnArr = [];
    var maxEntryCount = 1;
    var exportDataArr = exportData.replace(/\"/gi, '').slice(1, -1).split(',');
    var maxColNum = 0;

    // 가장 많은 multi entry 개수 구하기
    for (var j in exportDataArr) {
        if (exportDataArr[j] != "null" && multiLabelNumArr.indexOf(j) != -1) {
            var entryCount = exportDataArr[j].split(' | ').length;
            if (maxEntryCount < entryCount) {
                maxEntryCount = entryCount;
                maxColNum = j
            }
        }
    }

    // 가장 많은 multi entry y좌표 구하기
    var items = exportData;
    items = items.replace(/\"/gi, '').slice(1, -1);
    items = items.split(',');
    for (var m in items[maxColNum].split(' | ')) {
        returnArr.push({
            'num': m,
            'yLoc': items[maxColNum].split(' | ')[m].split('::')[0]
        });
    }

    return { dataArr : returnArr, dataCount: maxEntryCount };
}

//이미지 팝업 이벤트
function openImagePop(fileName) {
    var convertFilePath = fileName.split('.pdf')[0] + '-0.jpg';
    $('#PopupImg').attr('src', convertFilePath.replace(/\/uploads/,'/img'));
    layer_open('docPop');
    return false;
}

// 재학습 버튼 click 이벤트
function btnRetrainClick() {
    $('#btn_retrain').click(function () {
        if ($('input[name="listCheck"]:checked').length == 1) {
            var fileName = $('input[name="listCheck"]:checked').closest('td').next().find('input[type="text"]').val();
            location.href = '/uiLearning?fileName=' + fileName;
            //layer_open('retrainPop');
        } else {
            fn_alert('alert', '하나의 파일을 선택하세요.');
        }
    });
}

// All체크박스 선택시 row 배경색처리
function checkAllBoxClick() {
    $('#listCheckAll').click(function () {
        if ($(this).is(":checked")) {
            $('.originalTr').css('background-color', '#EA7169');
        } else {
            $('.originalTr').css('background-color', '');
        }
    });
}

// 체크박스 선택시 row 배경색처리
function checkBoxClick() {
    $('input[name="listCheck"]').click(function () {
        if ($(this).is(":checked")) {
            $(this).closest('tr').css('background-color', '#EA7169');
        } else {
            $(this).closest('tr').css('background-color', '');
        }
    });
}

// 전송 버튼 click 이벤트
function btnSendClick() {
    $('#btn_send').click(function () {
        var sendJson = [];

        // 체크한 row json 데이터 가공하기
        $('input[name="listCheck"]').each(function (i, e) {
            if ($(e).is(":checked")) {
                var itemJson = {
                    'sequence': $(e).prev().val(),
                    'fileName': $(e).closest('tr').children().eq(1).find('input').val()
                };
                //var ocrDataArr = [];
                var ocrDataItem = {}
                for (var j in labels) {
                    if (labels[j].AMOUNT == 'multi') { // multi entry
                        var tempArr = [$(e).closest('tr').children().eq(Number(j) + 3).find('input').val()];
                        for (var k = 0; k < $('.multiTr_' + $(e).prev().val()).length; k++) {
                            tempArr.push($('.multiTr_' + $(e).prev().val()).eq(k).children().eq(Number(j) + 3).find('input').val());
                        }
                        ocrDataItem[labels[j].KORNM] = tempArr;

                    } else { // single entry
                        ocrDataItem[labels[j].KORNM] = $(e).closest('tr').children().eq(Number(j) + 3).find('input').val();
                    }
                }
                //ocrDataArr.push(ocrDataItem);

                itemJson.ocrData = ocrDataItem;
                sendJson.push(itemJson);
            }
        });

        // 데이터 전송하기
        $.ajax({
            url: '/docManagement/sendOcrData',
            type: 'post',
            datatype: 'json',
            data: JSON.stringify({ 'sendData': sendJson }),
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function () {
                $('#progressMsgTitle').html("전송 중..");
                progressId = showProgressBar();
            },
            success: function (data) {
                console.log(data);
                if (!data.error) {

                } else {

                }
                endProgressBar(progressId);
            },
            error: function (err) {
                console.log(err);
                fn_alert('alert', 'ERROR');
                endProgressBar(progressId);
            }
        });
    });
}

// 페이징 번호 click 이벤트
function btnPagingClick() {
    $('.li_paging > a').click(function () {
        var docTopType = $('#docTopTypeSelect').val();
        var startDate = $('#searchStartDate').val();
        var endDate = $('#searchEndDate').val();
        var processState = $('#processStateSelect').val();
        var pagingCount = $(this).closest('.li_paging').val();

        var params = {
            'docTopType': docTopType,
            'startDate': startDate,
            'endDate': endDate,
            'processState': processState,
            'pagingCount': pagingCount
        };
        selectBatchPoMlExport(params, false);
    });
}

// 페이징처리 html 렌더링
function appendPaging(curPage, totalCount) {
    var paging_result = '';
    var maxPageInSet = 10, // 페이지 카운트 갯수
        maxEntityInPage = 30, // 한 페이지당 컨텐츠 수
        totalPage = Math.ceil(totalCount / maxEntityInPage), // 전체 페이지수
        totalSet = Math.ceil(totalPage / maxPageInSet), // 전체 세트수
        curSet = Math.ceil(curPage / maxPageInSet), // 현재 세트번호
        startPage = ((curSet - 1) * maxPageInSet) + 1, // 현재 세트내 출력될 시작 페이지
        endPage = (startPage + maxPageInSet) - 1; // 현재 세트내 출력될 마지막 페이지

    paging_result += '<ul class="pagination pagination-sm no-margin ">';
    //paging_result += '<li><a href="#"><i class="fa fa-angle-double-left"></i></a></li>';
    //paging_result += '<li><a href="#"><i class="fa fa-angle-left"></i></a></li>';
    /** 1개 세트내 Previous 페이지 출력여부 설정(PreviousPage=StartPage-1) **/
    if (curSet > 1) {
        paging_result += '<li class="li_paging" value="' + (startPage - 1) + '"><a href="#" onclick="return false;"><i class="fa fa-angle-left"></i></a></li>';
    }
    /** 1개 세트내 페이지 출력여부 설정(페이지 순환하면서 요청페이지와 같을 경우 해당 페이지 비활성화 처리) **/
    for (var i = startPage; i <= endPage; i++) {
        if (i > totalPage) break;
        paging_result += '<li class=' + (i == curPage ? '"li_paging active"' : '"li_paging"') + ' value="' + i + '"><a href="#" onclick="return false;">' + i + '</a></li>';
    }
    /** 1개 세트내 Next 페이지 출력여부 설정(NextPage=EndPage+1) **/
    if (curSet < totalSet) {
        paging_result += '<li class="li_paging" value="' + (endPage + 1) + '"><a href="#" onclick="return false;"><i class="fa fa-angle-right"></i></a></li>';
    }
    //paging_result += '<li><a href="#"><i class="fa  fa-angle-right"></i></a></li>';
    //paging_result += '<li><a href="#"><i class="fa  fa-angle-double-right"></i></a></li>';
    paging_result += '</ul>';
    return paging_result;
}