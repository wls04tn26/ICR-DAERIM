﻿var lineText = []; // line별로 가공된 ocr데이터 배열
var totCount = 0; // 전체 분석 문서 개수
var ocrCount = 0; // ocr 수행 횟수
var searchDBColumnsCount = 0; // DB컬럼 조회 수행 횟수
var thumbImgs = []; // 썸네일 이미지 경로 배열
var thumnImgPageCount = 1; // 썸네일 이미지 페이징 번호
var thumnbImgPerPage = 6; // 한 페이지당 썸네일 이미지 개수
var x, y, textWidth, textHeight; // 문서 글씨 좌표
var mouseX, mouseY, mouseMoveX, mouseMoveY; // 마우스 이동 시작 좌표, 마우스 이동 좌표
var docPopImages; // 문서조회팝업 이미지 리스트
var docPopImagesCurrentCount = 1; // 문서조회팝업 이미지 현재 카운트
var docType = '';
var currentImgCount = 0;

$(function () {

    init();
    uploadFileEvent();
    thumbImgPagingEvent();
    uiTrainEvent();
    popUpEvent();
    docPopRadioEvent();
    editBannedword();
    changeDocPopupImage();
});

// 초기 작업
function init() {
    $('.button_control').attr('disabled', true);
    //layer_open('layer1');
}

function docPopRadioEvent() {
    $('input:radio[name=radio_batch]').on('click', function () {
        var chkValue = $(this).val();

        if (chkValue == '1') {
            $('#orgDocName').show();
            $('#newDocName').hide();
            $('#notInvoice').hide();
        } else if (chkValue == '2') {
            $('#newDocName').show();
            $('#orgDocName').hide();
            $('#notInvoice').hide();
        } else if (chkValue == '3') {
            $('#notInvoice').show();
            $('#orgDocName').hide();
            $('#newDocName').hide();
        }
    })
}

// 팝업 이벤트 모음
function popUpEvent() {
    popUpRunEvent();
    popUpSearchDocCategory();
    popUpInsertDocCategory();
}

// 팝업 확인 이벤트
function popUpRunEvent() {

	$('#btn_pop_doc_run').click(function (e) {

		var data = layer4Data;
		var docSentenceList = [];
		var docSentence = "";
		//data = $('#mlData').val();

        // chkValue 1: 기존문서 양식조회, 2: 신규문서 양식등록, 3: 계산서 아님
        var chkValue = $('input:radio[name=radio_batch]:checked').val();
		//console.log(data);
        if ((chkValue == '1' && $('#orgDocName').val() == '') || (chkValue == '2' && $('#newDocName').val() == '')) {
            fn_alert('alert', 'The document name is missing');
            return false;
        }

        // text & check
        //var textList = [];
        //$('.batch_layer4_result_tr').each(function () {
        //    var chk = $(this).children().find('input[type="checkbox"]').is(':checked') == true ? 1 : 0;
        //    var text = $(this).children()[1].innerHTML;

        //    textList.push({"text": text, "check": chk})
        //})

        // docName
        var docName = '';
        if (chkValue == '1') {
            docName = $('#orgDocName').val();
        } else if (chkValue == '2') {
            docName = $('#newDocName').val();
        } else if(chkValue == '3') {
            docName = 'NotInvoice';
		}


		if (layer4Data.data.length > 20) {

			for (var i = 0; i < 20; i++) {

				//console.log(layer4Data.data[i].originText);
				docSentenceList.push({ "text": layer4Data.data[i].originText })
				docSentence = docSentence + layer4Data.data[i].originText;
			}
		}
		else {
			for (var i = 0; i < layer4Data.data.length; i++) {

				//console.log(layer4Data.data[i].originText);
				docSentenceList.push({ "text": layer4Data.data[i].originText })
				docSentence = docSentence + layer4Data.data[i].originText;
			}
		}

		//console.log(docSentenceList);
		//console.log(docSentence);



        var param = {
            imgId: $('#docPopImgId').val(),
            filepath: $('#docPopImgPath').val(),
            docName: docName,
            radioType: chkValue,
            //textList: textList,
			docTopType: $('#docToptype').val(),
			docSentenceList: docSentenceList 
		}
		//console.log("param : " + param.imgId + " @@ " + param.filepath + " @@ " + param.docName + " @@ " + param.radioType + " @@ " + param.docTopType);
		//console.log(layer4Data);

		

        $.ajax({
            url: '/uiLearning/insertDoctypeMapping',
            type: 'post',
            datatype: 'json',
            data: JSON.stringify(param),
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function () {
                $('#progressMsgTitle').html('문서양식 저장중...');
                progressId = showProgressBar();
            },
            success: function (data) {
                //location.href = location.href;
                // 해당 로우 화면상 테이블에서 삭제
                endProgressBar(progressId);
                var rowNum = $('#batchListRowNum').val();
                $('#leftRowNum_' + rowNum).find('td:eq(2) a').html(data.docName);
                $('#leftRowNum_' + rowNum).find('td:eq(2) input[name=docType]').val(data.docType);
                fn_alert('alert', '문서 양식 저장이 완료 되었습니다.');
                $('#layer4 .cbtn').click();
            },
            error: function (err) {
                console.log(err);
                endProgressBar(progressId);
            }
        });           
        
        /*
        $.ajax({
            url: '/batchLearningTest/insertDoctypeMapping',
            type: 'post',
            datatype: 'json',
            data: JSON.stringify(param),
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function () {
                $('#progressMsgTitle').html('문서양식 저장중...');
                progressId = showProgressBar();
            },
            success: function (data) {
                //location.href = location.href;
                // 해당 로우 화면상 테이블에서 삭제               
                setTimeout(function () {
                    endProgressBar(progressId);
                    fn_alert('alert', '문서 등록이 완료 되었습니다.');
                    $('#btn_pop_doc_cancel.ui_doc_pop_btn2.cbtn').click();
                    var rowNum = $('#batchListRowNum').val();
                    $('#leftRowNum_' + rowNum).remove();
                    $('.rowNum' + rowNum).remove();
                    $('.mlRowNum' + rowNum).remove();
                }, 5000);
                
                endProgressBar(progressId);
                $('#btn_pop_doc_cancel').click();
                var rowNum = $('#batchListRowNum').val();
                $('#leftRowNum_' + rowNum).remove();
                $('.rowNum' + rowNum).remove();
                $('.mlRowNum' + rowNum).remove();
                
            },
            error: function (err) {
                console.log(err);
                endProgressBar(progressId);
            }
        });  
        */
    })

    // 20180910 hskim 문장 선택 결과 같이 전송
    /*
    $('#btn_pop_doc_run').click(function (e) {
        var docData = JSON.parse($('#docData').val());
        for (var i in docData) {
            if ($('#searchResultDocName').val() == docData[i].DOCNAME) {
                $('#docName').text(docData[i].DOCNAME);
                $('#docData').val(JSON.stringify(docData[i]));
                break;
            }
        }
        $(this).parents('.poplayer').fadeOut();
        e.stopPropagation();
        e.preventDefault();
    });
    $('#btn_pop_doc_cancel').click(function (e) {
        $('#docData').val('');

        e.stopPropagation();
        e.preventDefault();
    });
    */
}


//팝업 문서 양식 LIKE 조회
function popUpSearchDocCategory() {
    $('#searchDocCategoryBtn').click(function () {
        var keyword = $('#searchDocCategoryKeyword').val().replace(/ /gi, '');

        if (keyword) {
            $('#docSearchResultImg_thumbCount').hide();
            $('#docSearchResultMask').hide();
            $('#searchResultDocName').html('');
            $('#orgDocName').val('');
            $('#searchResultDocName').val('');
            $('#countCurrent').html('1');
            $.ajax({
                url: '/uiLearning/selectLikeDocCategory',
                type: 'post',
                datatype: 'json',
                data: JSON.stringify({ 'keyword': keyword }),
                contentType: 'application/json; charset=UTF-8',
                success: function (data) {
                    data = data.data;
                    //$('#docData').val(JSON.stringify(data));
                    $('#docSearchResult').html('');
                    //$('#countCurrent').html('1');
                    $('.button_control10').attr('disabled', true);
                    docPopImagesCurrentCount = 1;
                    if (data.length == 0) {
                        return false;
                    } else {
                        /**
                         결과에 따른 이미지폼 만들기
                         */
                        docPopImages = data;
						console.log(docPopImages);
                        var searchResultImg = '<img id="searchResultImg" src="/sample/' + docPopImages[docPopImagesCurrentCount - 1].SAMPLEIMAGEPATH + '">';

                        $('#docSearchResult').empty().append(searchResultImg);

                        $('#searchResultDocName').val(data[0].DOCNAME);
                        if (data.length != 1) {
                            $('.button_control12').attr('disabled', false);
                        }
                        $('#orgDocName').val(data[0].DOCNAME);
                        $('#docSearchResultMask').show();
                        $('#countLast').html(data.length);
                        $('#docSearchResultImg_thumbCount').show();
                    }
                },
                error: function (err) {
                    console.log(err);
                }
            });
        } else {
            fn_alert('alert', 'Please enter your search keyword');
        }
    });
}

//팝업 문서 양식 등록
function popUpInsertDocCategory() {
    $('#insertDocCategoryBtn').click(function () {
        if ($('.ez-selected').children('input').val() == 'choice-2') {
            var docName = $('#newDocName').val();
            var sampleImagePath = $('#originImg').attr('src').split('/')[2] + '/' + $('#originImg').attr('src').split('/')[3];
            $.ajax({
                url: '/uiLearning/insertDocCategory',
                type: 'post',
                datatype: 'json',
                data: JSON.stringify({ 'docName': docName, 'sampleImagePath': sampleImagePath }),
                contentType: 'application/json; charset=UTF-8',
                success: function (data) {
                    if (data.code == 200) {
                        //console.log(data);
                        $('#docData').val(JSON.stringify(data.docCategory[0]));
                        $('#docName').text(data.docCategory[0].DOCNAME);
                        $('#layer1').fadeOut();
                    } else {
                        fn_alert('alert', data.message);
                    }
                },
                error: function (err) {
                    console.log(err);
                }
            });
        } else {
        }
    });
}

// 개별 학습 파일 업로드 이벤트
function uploadFileEvent() {
    $('#uploadFile').change(function () {
        if ($(this).val() !== '') {
            lineText = [];
            $('#imageBox').html('');
            totCount = 0;
            ocrCount = 0;
            searchDBColumnsCount = 0;
            $("#uploadFileForm").attr("action", "/common/imageUpload");
            $('#uploadFileForm').submit();
        }
    });
    $('#uploadFile').click(function(e){
        e.stopPropagation();
    });

    $('#uploadForm').click(function () {
        $('#uploadFile').click();
    });


    $('#uploadFileForm').ajaxForm({
        beforeSubmit: function (data, frm, opt) {
            $('#progressMsgTitle').html('파일 업로드 중..');
            progressId = showProgressBar();
            //startProgressBar(); // start progressbar
            //addProgressBar(1, 10); // proceed progressbar
            return true;
        },
        success: function (responseText, statusText) {
            //console.log(responseText);
            $('#progressMsgTitle').html('파일 업로드 완료..');
            $('.button_control').attr('disabled', false);
            $('#textResultTbl').html('');
            //addProgressBar(11, 20);
            if (responseText.message.length > 0) {
                //console.log(responseText);
                totCount = responseText.message.length;
                for (var i = 0; i < responseText.fileInfo.length; i++) {
                    processImage(responseText.fileInfo[i]);
                }
                /*
                for (var i = 0; i < responseText.message.length; i++) {
                    processImage(responseText.message[i]);
                }
                */
            }
            //endProgressBar();
        },
        error: function (e) {
            endProgressBar(progressId); // 에러 발생 시 프로그레스바 종료
            //console.log(e);
        }
    });

    // 파일 드롭 다운
    var dropZone = $("#uploadForm");
    //Drag기능
    dropZone.on('dragenter', function (e) {
        e.stopPropagation();
        e.preventDefault();
        // 드롭다운 영역 css
        dropZone.css('background-color', '#E3F2FC');
    });
    dropZone.on('dragleave', function (e) {
        e.stopPropagation();
        e.preventDefault();
        // 드롭다운 영역 css
        dropZone.css('background-color', 'transparent');
    });
    dropZone.on('dragover', function (e) {
        e.stopPropagation();
        e.preventDefault();
        // 드롭다운 영역 css
        dropZone.css('background-color', '#E3F2FC');
    });
    dropZone.on('drop', function (e) {
        e.preventDefault();
        // 드롭다운 영역 css
        dropZone.css('background-color', 'transparent');

        var files = e.originalEvent.dataTransfer.files;
        if (files != null) {
            if (files.length > 1) {
                fn_alert('alert', "2개 이상 업로드 불가합니다");
                return;
            }

            F_FileMultiUpload(files, dropZone);

        } else {
            fn_alert('alert', "ERROR");
        }
    });

    // 파일 멀티 업로드
    function F_FileMultiUpload(files, obj) {
        fn_alert('confirm', files[0].name + " 파일을 업로드 하시겠습니까?", function () {
            var data = new FormData();
            for (var i = 0; i < files.length; i++) {
                data.append('file', files[i]);
            }

            lineText = [];
            $('#imageBox').html('');
            totCount = 0;
            ocrCount = 0;
            searchDBColumnsCount = 0;

            $.ajax({
                url: "/common/imageUpload",
                method: 'post',
                data: data,
                dataType: 'json',
                processData: false,
                contentType: false,
                beforeSend: function () {
                    $("#progressMsgTitle").html("파일 업로드 중..");
                    progressId = showProgressBar();
                },
                success: function (responseText, statusText) {
                    //console.log(responseText);
                    $('#progressMsgTitle').html('파일 업로드 완료..');
                    $('.button_control').attr('disabled', false);
                    $('#textResultTbl').html('');
                    //addProgressBar(11, 20);
                    if (responseText.message.length > 0) {
                        //console.log(responseText);
                        totCount = responseText.message.length;
                        for (var i = 0; i < responseText.fileInfo.length; i++) {
                            processImage(responseText.fileInfo[i]);
                        }
                        /*
                        for (var i = 0; i < responseText.message.length; i++) {
                            processImage(responseText.message[i]);
                        }
                        */
                    }
                    //endProgressBar();
                },
                error: function (e) {
                    console.log("업로드 에러");
                    endProgressBar(progressId);
                }
            });
        });
    }
}

// OCR API
function processImage(fileInfo) {

    $('#progressMsgTitle').html('OCR 처리 중..');
    //addProgressBar(21, 30);
    $.ajax({
        url: '/common/ocr',
        beforeSend: function (jqXHR) {
            jqXHR.setRequestHeader('Content-Type', 'application/json');
        },
        async: false,
        type: 'POST',
        data: JSON.stringify({ 'fileInfo': fileInfo })
    }).success(function (data) {
        console.log("============================ ocr data ============================ ");
        console.log(data);
        console.log("============================ ocr data ============================ ");
        ocrCount++;
        if (!data.code) { // 에러가 아니면
            //console.log(data);
            //thumbImgs.push(fileInfo.convertFileName);
            $('#progressMsgTitle').html('OCR 처리 완료');
            //addProgressBar(31, 40);
            if (ocrCount == 1) {
                $('#ocrData').val(JSON.stringify(data));
            }
            appendOcrData(fileInfo, data);
        } else if (data.error) { //ocr 이외 에러이면
            //endProgressBar();
            //fn_alert('alert', data.error);
            //location.href = '/uiLearning';
        } else { // ocr 에러 이면
            insertCommError(data.code, 'ocr');
            endProgressBar(progressId);
            //endProgressBar();
            fn_alert('alert', data.message);
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
    });

};

function insertCommError(eCode, type) {
    $.ajax({
        url: '/common/insertCommError',
        type: 'post',
        datatype: 'json',
        data: JSON.stringify({ 'eCode': eCode, type: type }),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
        },
        success: function (data) {
        },
        error: function (err) {
            //console.log(err);
        }
    });
}

// 썸네일 이미지 페이지 이동 버튼 클릭 이벤트
function thumbImgPagingEvent() {
    $('#thumb-prev').click(function () {
        thumnImgPageCount--;
        thumbImgPaging(thumnImgPageCount);
    });
    $('#thumb-next').click(function () {
        thumnImgPageCount++;
        thumbImgPaging(thumnImgPageCount);
    });
}

function changeOcrImg(data) {
    $('#imageBox > li').removeClass('on');
    $(data).parent().parent().parent().addClass('on');
    var fileName = data.src.substring(data.src.lastIndexOf("/") + 1, data.src.length);
    $('#imageZoom').hide();
    $('#mainImage').css('background-image', 'url("/tif/' + fileName + '")');
}

// 초기 썸네일 이미지 렌더링
function thumnImg() {
    for (var i in thumbImgs) {
        if ($('#imageBox > li').length < thumnbImgPerPage) {
            var imageTag = '';
            
            if (i == 0) {
                imageTag = '<li class="on"><div class="box_img"><i><img src="/tif/' + thumbImgs[i] + '" onclick="changeOcrImg(this)" style="background-color: white;"></i>'
                    + ' </div ><span>' + thumbImgs[i] + '</span></li >';
            } else {
                imageTag = '<li><div class="box_img"><i><img src="/tif/' + thumbImgs[i] + '" onclick="changeOcrImg(this)" style="background-color: white;"></i>'
                    + ' </div ><span>' + thumbImgs[i] + '</span></li >';
            }
            $('#imageBox').append(imageTag);
        } else {
            break;
        }
    }
    //$('#thumb-tot').attr('disabled', false);
    $('#thumb-tot').removeAttr('disabled');
    if (thumbImgs.length > thumnbImgPerPage) {
        $('#thumb-prev').attr('disabled', true);
        //$('#thumb-next').attr('disabled', false);
        $('#thumb-next').removeAttr('disabled');
    } else {
        $('#thumb-prev').attr('disabled', true);
        $('#thumb-next').attr('disabled', true);
    }
    //console.log(thumbImgs);
}

// 썸네일 이미지 페이징
function thumbImgPaging(pageCount) {
    $('#imageBox').html('');
    var startImgCnt = thumnbImgPerPage * pageCount - thumnbImgPerPage;
    var endImgCnt = thumnbImgPerPage * pageCount;

    if (startImgCnt == 0) {
        $('#thumb-prev').attr('disabled', true);
    } else {
        //$('#thumb-prev').attr('disabled', false);
        $('#thumb-prev').removeAttr('disabled');
    }

    if (endImgCnt >= thumbImgs.length) {
        endImgCnt = thumbImgs.length;
        $('#thumb-next').attr('disabled', true);
    } else {
        //$('#thumb-next').attr('disabled', false);
        $('#thumb-next').removeAttr('disabled');
    }

    var imageTag = '';
    for (var i = startImgCnt; i < endImgCnt; i++) {
        //imageTag += '<li>';
        //imageTag += '<a href="javascript:void(0);" class="imgtmb thumb-img" style="background-image:url(../../uploads/' + thumbImgs[i] + '); width: 48px;"></a>';
        //imageTag += '</li>';
        imageTag += '<li><div class="box_img"><i><img src="/tif/' + thumbImgs[i] + '" onclick="changeOcrImg(this)" style="background-color: white;"></i>'
            + ' </div ><span>' + thumbImgs[i] + '</span></li >';
    }
    $('#imageBox').append(imageTag);
    thumbImgEvent();
}

// 썸네일 이미지 클릭 이벤트
function thumbImgEvent() {
    $('.thumb-img').click(function () {
        $('#imageBox > li').removeClass('on');
        $(this).parent().addClass('on');
        $('#mainImage').css('background-image', $(this).css('background-image'));
        detailTable($(this).css('background-image').split('/')[4].split('")')[0]);
    });
}

// 상세 테이블 렌더링 & DB컬럼 조회
function appendOcrData(fileInfo, data) {
    $('#docPopImgPath').val(fileInfo.filePath);
    var param = {
        'ocrData': data,
        'filePath': fileInfo.filePath,
        'fileName': fileInfo.convertFileName
    }

    executeML(param);

}

function executeML(totData) {
    $('#progressMsgTitle').html('머신러닝 처리 중..');
    $.ajax({
        url: '/uiLearning/uiLearnTraining',
        type: 'post',
        datatype: 'json',
        async: false,
        data: JSON.stringify(totData),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            console.log(data);
            if (data.column) searchDBColumnsCount++;
            if (data.message) {
                fn_alert('alert', message);
            } else {
                //console.log(data);
                lineText.push(data);
                thumbImgs.push(data.fileName);
                selectTypoText(lineText.length-1, data.fileName);
                $('#docSid').val(data.data.docSid);
                $('#docType').val(data.data.docCategory.DOCTYPE);
                if (searchDBColumnsCount == 1) {
                    /*
                    var docName = '';
                    var docScore = '';
                   
                    if (data.docCategory != null) {
                        docName = data.docCategory[0].DOCNAME;
                        $('#docData').val(JSON.stringify(data.docCategory[0]));
                    }

                    if (data.score) {
                        docScore = data.score;
                    }
                    */
                    $('#docName').text(data.data.docCategory.DOCNAME);
                    $('#docPredictionScore').text('100 %');

                    var mainImgHtml = '';
                    mainImgHtml += '<div id="mainImage" class="ui_mainImage">';
                    //mainImgHtml += '<div id="redNemo">';
                    //mainImgHtml += '</div>';
                    mainImgHtml += '</div>';
                    mainImgHtml += '<div id="imageZoom" ondblclick="viewOriginImg()">';
                    mainImgHtml += '<div id="redZoomNemo">';
                    mainImgHtml += '</div>';
                    mainImgHtml += '</div>';
                    $('#img_content').html(mainImgHtml);
                    $('#mainImage').css('background-image', 'url("/tif/' + data.fileName + '")');
                    
                    $('#imageBox > li').eq(0).addClass('on');
                    /*
                    $('#mlPredictionDocName').val(docName);
                    $('#mlPredictionPercent').val(docScore + '%');
                    $('#docName').html(docName);
                    $('#docPredictionScore').html(docScore + '%');
                    if (docScore >= 90) {
                        $('#docName').css('color', 'dodgerblue');
                        $('#docPredictionScore').css('color', 'dodgerblue');
                    } else {
                        $('#docName').css('color', 'darkred');
                        $('#docPredictionScore').css('color', 'darkred');
                    }
                    */
                    //selectTypoText(0, data.fileName);
                    //detailTable(fileName);
                    //docComparePopup(0);
                }

                if (totCount == searchDBColumnsCount) {
                    thumnImg();
                    thumbImgEvent();
                    //addProgressBar(91, 99);
                    $('#uploadForm').hide();
                    $('#uploadSucessForm').show();
                    $('.content_sub_document_title').show();
                }
            }
        },
        error: function (err) {
            console.log(err);
            endProgressBar(progressId);
            //endProgressBar();
        }
    });
}

// html 렌더링 전처리 (출재사명, 계약명, 화폐코드 처리)
function selectTypoText(index, fileName) {
    //var item = lineText[index].data;
    var item = lineText[index];

    var param = [];
    detailTable(fileName);
    docComparePopup(0);
    /*
    $.ajax({
        url: 'common/selectTypoData2',
        type: 'post',
        datatype: 'json',
        data: JSON.stringify({ 'data': item }),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            lineText[index].data.data = data.data;
            detailTable(fileName);
            docComparePopup(0);

            endProgressBar(progressId);
            //endProgressBar();
        },
        error: function (err) {
            endProgressBar(progressId);
            //endProgressBar();
            console.log(err);
        }
    });
    */
    endProgressBar(progressId);
}

function docPopInit() {
    $('#originImgDiv').empty();
    $('#mlPredictionDocName').val('');
    $('#mlPredictionPercent').val('');
    $('#docSearchResultImg_thumbCount').hide();
    $('#docSearchResultMask').hide();
    $('#countCurrent').empty();
    $('#countLast').empty();
    $('#mlPredictionPercent').val('');
    $('#orgDocSearchRadio').click();
    $('.ui_doc_pop_ipt').val('');
    $('#docSearchResult').empty();
    $('#searchResultDocName').val('');
    $('#searchDocCategoryKeyword').val('');
    $('#ui_layer1_result').empty();
}

//문서 비교 popup 버튼 클릭 이벤트
function docComparePopup(imgIndex) {
    $('#docCompareBtn').unbind('click');
    $('#docCompareBtn').click(function (e) {
        docPopInit();
        changeOcrDocPopupImage();
        selectClassificationSt($('#docPopImgPath').val());
        $('#mlPredictionDocName').val($('#docName').text());
        $('#mlPredictionPercent').val($('#docPredictionScore').text());
        var appendImg = '<img id="originImg" src="/tif/' + lineText[imgIndex].fileName + '" style="width: 100%;height: 480px;">'
        $('#originImgDiv').html(appendImg);
        //$('#originImg').attr('src', '../../uploads/' + lineText[imgIndex].fileName);
        //$('#searchImg').attr('src', '../../' + lineText[imgIndex].docCategory.SAMPLEIMAGEPATH);
        layer_open('layer1');
        e.preventDefault();
        e.stopPropagation();
    });
}

// 분류제외문장 조회
function selectClassificationSt(filepath) {

    var param = {
        filepath: filepath
    };

    $.ajax({
        url: '/uiLearning/selectClassificationSt',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            //addProgressBar(1, 99);
        },
        success: function (data) {
            //console.log("SUCCESS selectClassificationSt : " + JSON.stringify(data));
            if (data.code != 500 && data.data.length == 1) {

                var ocrdata = JSON.parse(data.data[0].OCRDATA);

                //순서 정렬 로직
                let tempArr = new Array();
                for (let item in ocrdata) {
                    tempArr[item] = new Array(makeindex(ocrdata[item].location),   ocrdata[item]);
                }

                tempArr.sort(function (a1, a2) {
                    a1[0] = parseInt(a1[0]);
                    a2[0] = parseInt(a2[0]);
                    return (a1[0]<a2[0]) ? -1 : ((a1[0]>a2[0]) ? 1 : 0);
                });

                for (let i = 0; i < tempArr.length; i++) {

                    var resultOcrData = '<tr class="batch_layer4_result_tr">'
                                    + '<td><input type="checkbox" class="batch_layer4_result_chk"></td>'
                                    + '<td class="td_sentence"></td></tr>';
                    $('#batch_layer4_result').append(resultOcrData);
                    
                    $('.td_sentence:eq('+ i +')').text(tempArr[i][1].text);
                }
                $('#batch_layer4_result input[type=checkbox]').ezMark();

                for (var i = 0; i < $("input[type='checkbox'].batch_layer4_result_chk").length; i++) {
                    $("input[type='checkbox'].batch_layer4_result_chk").eq(i).parent().removeClass("ez-hide");
                    $("input[type='checkbox'].batch_layer4_result_chk").eq(i).prop("checked", true);
                    $("input[type='checkbox'].batch_layer4_result_chk").eq(i).parent().addClass("ez-checked")
    
                    if (i == 20) {
                        break;
                    }
                }
                
            }

        },
        error: function (err) {
            console.log(err);
        }
    })
}

function makeindex(location) {
    let temparr = location.split(",");
    for (let i = 0; i < 5; i++) {
        if (temparr[0].length < 5) {
            temparr[0] = '0' + temparr[0];
        }
    }
    return Number(temparr[1] + temparr[0]);
}

// 상세 테이블 렌더링
function detailTable(fileName) {

    //$('#textResultTbl').html('');
    var tblSortTag = '';
    var tblTag = '';
    //console.log(lineText);
    for (var i = 0; i < lineText.length; i++) {

        if (lineText[i].fileName == fileName) {

            var item = lineText[i];
            var data;

            if (item.data.data) {
                data = item.data.data;
            } else {
                data = item.data;
            }

            // UNKNOWN selectbox 제일 위로 올리기
            var columnArr = item.column;
            columnArr.unshift(columnArr.pop());
            var entryColArr = item.entryMappingList;
            entryColArr.unshift(entryColArr.pop());

            //$('#docName').text(item.data.docCategory.DOCNAME);
            //$('#docPredictionScore').text((item.data.docCategory.DOCSCORE * 100) + ' %');

            for (var i in data) {
                // colLbl이 37이면 entryLbl 값에 해당하는 entryColoumn 값을 뿌려준다
                if (data[i].colLbl == 37) {
                    tblTag += '<dl>';
                    tblTag += '<dt onclick="zoomImg(this,' + "'" + fileName + "'" + ')">';
                    if (data[i].originText) {
                        tblTag += '<label for="langDiv' + i + '" class="" title="Accuracy : 95% &lt;/p&gt;&lt;p&gt; Ocr text : ' + data[i].originText + '" style="width:100%;">';
                    } else {
                        tblTag += '<label for="langDiv' + i + '" class="" title="Accuracy : 95% &nbsp;&nbsp;" style="width:100%;">';
                    }
                    tblTag += '<input type="text" value="' + data[i].text + '" style="width:100% !important; border:0;" />';
                    tblTag += '<input type="hidden" value="' + data[i].location + '" />';
                    tblTag += '<input type="hidden" value="' + fileName + '" />';
                    tblTag += '</label>';
                    tblTag += '</dt>';
                    tblTag += '<dd>';
                    tblTag += '<input type="checkbox" class="entryChk" checked>';
                    tblTag += '</dd>';
                    tblTag += '<dd class="columnSelect" style="display:none">';
                    tblTag += appendOptionHtml((data[i].colLbl + '') ? data[i].colLbl : 999, columnArr);
                    tblTag += '</dd>';
                    tblTag += '<dd class="entrySelect">';
                    tblTag += appendEntryOptionHtml((data[i].entryLbl + '') ? data[i].entryLbl : 999, entryColArr);
                    tblTag += '</dd>';
                    tblTag += '</dl>';
                } else if (data[i].colLbl == 38) {
                    tblSortTag += '<dl>';
                    tblSortTag += '<dt onclick="zoomImg(this,' + "'" + fileName + "'" + ')">';
                    if (data[i].originText) {
                        tblSortTag += '<label for="langDiv' + i + '" class="" title="Accuracy : 95% &lt;/p&gt;&lt;p&gt; Ocr text : ' + data[i].originText + '" style="width:100%;">';
                    } else {
                        tblSortTag += '<label for="langDiv' + i + '" class="" title="Accuracy : 95% &nbsp;&nbsp;" style="width:100%;">';
                    }
                    tblSortTag += '<input type="text" value="' + data[i].text + '" style="100% !important; border:0;" />';
                    tblSortTag += '<input type="hidden" value="' + data[i].location + '" />';
                    tblSortTag += '<input type="hidden" value="' + fileName + '" />';
                    tblSortTag += '</label>';
                    tblSortTag += '</dt>';
                    tblSortTag += '<dd>';
                    tblSortTag += '<input type="checkbox" class="entryChk">';
                    tblSortTag += '</dd>';
                    tblSortTag += '<dd class="columnSelect">';
                    tblSortTag += appendOptionHtml((data[i].colLbl + '') ? data[i].colLbl : 999, columnArr);
                    tblSortTag += '</dd>';
                    tblSortTag += '<dd class="entrySelect" style="display:none">';
                    tblSortTag += appendEntryOptionHtml((data[i].entryLbl + '') ? data[i].entryLbl : 999, entryColArr);
                    tblSortTag += '</dd>';
                    tblSortTag += '</dl>';
                } else {
                    tblTag += '<dl>';
                    tblTag += '<dt onclick="zoomImg(this,' + "'" + fileName + "'" + ')">';
                    if (data[i].originText) {
                        tblTag += '<label for="langDiv' + i + '" class="" title="Accuracy : 95% &lt;/p&gt;&lt;p&gt; Ocr text : ' + data[i].originText + '" style="width:100%;">';
                    } else {
                        tblTag += '<label for="langDiv' + i + '" class="" title="Accuracy : 95% &nbsp;&nbsp;" style="width:100%;">';
                    }
                    tblTag += '<input type="text" value="' + data[i].text + '" style="100% !important; border:0;" />';
                    tblTag += '<input type="hidden" value="' + data[i].location + '" />';
                    tblTag += '<input type="hidden" value="' + fileName + '" />';
                    tblTag += '</label>';
                    tblTag += '</dt>';
                    tblTag += '<dd>';
                    tblTag += '<input type="checkbox" class="entryChk">';
                    tblTag += '</dd>';
                    tblTag += '<dd class="columnSelect">';
                    tblTag += appendOptionHtml((data[i].colLbl + '') ? data[i].colLbl : 999, columnArr);
                    tblTag += '</dd>';
                    tblTag += '<dd class="entrySelect" style="display:none">';
                    tblTag += appendEntryOptionHtml((data[i].entryLbl + '') ? data[i].entryLbl : 999, entryColArr);
                    tblTag += '</dd>';
                    tblTag += '</dl>';
                }
            }

            /*
            var item = lineText[i];
            var sort = item.column;
            var sortBool = true;
            for (var sortN in sort) {
                for (var dataN in item.data) {
                    if (sort[sortN].ENKEYWORD == item.data[dataN].column) {
                        tblSortTag += '<dl>';
                        tblSortTag += '<dt onmouseover="zoomImg(this)" onmouseout="moutSquare(this)">';
                        tblSortTag += '<label for="langDiv' + i + '" class="tip" title="Accuracy : 95%" style="width:100%;">';
                        if (item.data[dataN].text.length > 34) {
                            tblSortTag += '<label class="iclick">'
                            tblSortTag += '<input type="text" value="' + item.data[dataN].text + '" class="inputst_box01"/>';
                            tblSortTag += '</label>'
                        } else {
                            tblSortTag += '<input type="text" value="' + item.data[dataN].text + '" class="inputst_box01"/>';
                        }
                        tblSortTag += '<input type="hidden" value="' + item.data[dataN].location + '" />';
                        tblSortTag += '</label>';
                        tblSortTag += '</dt>';
                        tblSortTag += '<dd>';
                        tblSortTag += '<div class="selects">';
                        tblSortTag += '<ul class="selectBox">';
                        tblSortTag += dbColumnsOption(item.data[dataN], item.column);
                        tblSortTag += '</div>';
                        tblSortTag += '</dd>';
                        tblSortTag += '</dl>';
                    }
                }
            }

            for (var j = 0; j < item.data.length; j++) {

                for (var sortN in sort) {
                    if (item.data[j].column == sort[sortN].ENKEYWORD) {
                        sortBool = false;
                        break;
                    }
                }

                if (sortBool == true) {
                    tblTag += '<dl>';
                    tblTag += '<dt onmouseover="zoomImg(this)" onmouseout="moutSquare(this)">';
                    tblTag += '<label for="langDiv' + i + '" class="tip" title="Accuracy : 95%" style="width:100%;">';
                    tblTag += '<input type="text" value="' + item.data[j].text + '" style="width:100%; border:0;" />';
                    tblTag += '<input type="hidden" value="' + item.data[j].location + '" />';
                    tblTag += '</label>';
                    tblTag += '</dt>';
                    tblTag += '<dd>';
                    tblTag += '<div class="selects">';
                    tblTag += '<ul class="selectBox">';
                    tblTag += dbColumnsOption(item.data[j], item.column);
                    tblTag += '</div>';
                    tblTag += '</dd>';
                    tblTag += '</dl>';
                }
            }
            break;
            */

        }

        /* 몇 페이지 어디인지 표시
        var item = lineText[i];
        for (var j = 0; j < item.data.length; j++) {
            tblTag += '<tr onmouseover="zoomImg(this)" onmouseout="moutSquare(this)">';
            //tblTag += '<tr>';
            tblTag += '<td>';
            tblTag += '<input type="text" value="' + item.data[j].text + '" style="width:100%; border:0;" />';
            tblTag += '<input type="hidden" value="' + item.data[j].location + '" alt="' + item.fileName + '" />';
            tblTag += '</td>';
            tblTag += '<td>';
            tblTag += '<select style="width:100%; height:100%;  border:0;">';
            tblTag += dbColumnsOption(item.dbColumns);
            tblTag += '</select>';
            tblTag += '</td>';
            tblTag += '</tr>';
        }
        */
    }
    $('#textResultTbl').append(tblTag).append(tblSortTag);
    // input 태그 마우스오버 말풍선 Tooltip 적용
    $('#textResultTbl input[type=checkbox]').ezMark();
    new $.Zebra_Tooltips($('.tip'));
    dbSelectClickEvent();
    $('select').stbDropdown();
    checkBoxMLCssEvent();

    $(".entryChk").change(function () {

        if ($(this).is(":checked")) {
            $(this).closest('dl').find('.columnSelect').hide();
            $(this).closest('dl').find('.entrySelect').show();
        } else {
            $(this).closest('dl').find('.columnSelect').show();
            $(this).closest('dl').find('.entrySelect').hide();
        }

    })
}

function checkBoxMLCssEvent() {
    $('#textResultTbl .ez-checkbox').each(function (i, e) {
        if ($(e).hasClass('ez-checked')) {
            $(e).closest('dl').children().css('background', '#EA7169')
                .find('input[type="text"]').css('color', '#FFF').css('background', '#EA7169');
        }
    });

    
    $('#textResultTbl .ez-checkbox').unbind('click');
    $('#textResultTbl .ez-checkbox').click(function () {
        if (!$(this).hasClass('ez-checked')) {
            $(this).closest('dl').children().css('background', '#EA7169')
                .find('input[type="text"]').css('color', '#FFF').css('background', '#EA7169');
        } else {
            $(this).closest('dl').children().css('background', '#FFF')
                .find('input[type="text"]').css('color', '#8C8C8C').css('background', '#FFF');
        }
    });
    
}

// 컬럼 select html 가공 함수
function appendOptionHtml(targetColumn, columns) {

    var selectHTML = '<select>';
    for (var i in columns) {
        var optionHTML = '';
        if (targetColumn == columns[i].COLNUM) {
            optionHTML = '<option value="' + columns[i].COLNUM + '" selected>' + columns[i].COLNAME + '</option>';
        } else {
            optionHTML = '<option value="' + columns[i].COLNUM + '">' + columns[i].COLNAME + '</option>';
        }
        selectHTML += optionHTML
    }
    selectHTML += '</select>'

    return selectHTML;
}

// Entry컬럼 select html 가공 함수
function appendEntryOptionHtml(targetColumn, columns) {

    var selectHTML = '<select>';
    for (var i in columns) {
        var optionHTML = '';
        if (targetColumn == columns[i].COLNUM) {
            optionHTML = '<option value="' + targetColumn + '" selected>' + columns[i].COLNAME + '</option>';
        } else {
            optionHTML = '<option value="' + targetColumn + '">' + columns[i].COLNAME + '</option>';
        }
        selectHTML += optionHTML
    }
    selectHTML += '</select>'

    return selectHTML;
}

// DB 컬럼 option 렌더링
function dbColumnsOption(data, column) {
    var optionTag = '';
    var selected = '';

    optionTag += '<li>';
    var isMatch = false;

    if (data.column != null) {
        for (var cNum in column) {
            if (data.column == column[cNum].ENKEYWORD) {

                var gubun = '';

                if (column[cNum].LABEL == "fixlabel" || column[cNum].LABEL == "entryrowlabel") {
                    gubun = "::LABEL";
                } else if (column[cNum].LABEL == "fixvalue" || column[cNum].LABEL == "entryvalue") {
                    gubun = "::VALUE";
                }

                optionTag += '<a class="dbColumnText" href="javascript:void(0);">' + column[cNum].KOKEYWORD + gubun + '</a>';
            }
        }
    } else {
        optionTag += '<a class="dbColumnText" href="javascript:void(0);">none</a>';
    }
    optionTag += '<ul>';
    for (var row of column) {

        var gubun = '';

        if (row.LABEL == "fixlabel" || row.LABEL == "entryrowlabel") {
            gubun = "::LABEL";
        } else if (row.LABEL == "fixvalue" || row.LABEL == "entryvalue") {
            gubun = "::VALUE";
        }

        optionTag += '<li class="secondLi">';
        optionTag += '<a href="javascript:void(0);"><span>' + row.KOKEYWORD + gubun + '</span></a>';
        optionTag += '<ul>';
        optionTag += '<li class="thirdLi"><a href="javascript:void(0);">키워드</a></li>';
        optionTag += '<li class="thirdLi"><a href="javascript:void(0);">가변값</a></li>';
        optionTag += '</ul>';
        optionTag += '</li>';
    }
    optionTag += '<li class="secondLi">';
    optionTag += '<a href="javascript:void(0);"><span>none</span></a>';
    optionTag += '<ul>';
    optionTag += '<li class="thirdLi"><a href="javascript:void(0);">키워드</a></li>';
    optionTag += '<li class="thirdLi"><a href="javascript:void(0);">가변값</a></li>';
    optionTag += '</ul>';
    optionTag += '</li>';

    optionTag += '</ul>';
    optionTag += '</li>';


    return optionTag;
}

// 마우스 오버 이벤트
function zoomImg(e, fileName) {
    // 해당 페이지로 이동
    /* 몇 페이지 어디인지 표시
    var fileName = $(e).find('input[type=hidden]').attr('alt');
    $('.thumb-img').each(function (i, el) {
        if ($(this).attr('src').split('/')[3] == fileName) {
            $(this).click();
        }
    });
    */

    var mainImage = $("#mainImage").css('background-image');
    mainImage = mainImage.replace('url(', '').replace(')', '').replace(/\"/gi, "");
    mainImage = mainImage.substring(mainImage.lastIndexOf("/") + 1, mainImage.length);

    if (mainImage != fileName) {
        $('#mainImage').css('background-image', 'url("/tif/' + fileName + '")');
    }

    //실제 이미지 사이즈와 메인이미지div 축소율 판단
    var reImg = new Image();
    var imgPath = $('#mainImage').css('background-image').split('("')[1];
    imgPath = imgPath.split('")')[0];
    reImg.src = imgPath;
    var width = reImg.width;
    var height = reImg.height;

    //imageZoom 고정크기
    var fixWidth = 744;
    var fixHeight = 1052;

    var widthPercent = fixWidth / width;
    var heightPercent = fixHeight / height;

    $('#mainImage').hide();
    $('#imageZoom').css('height', '570px').css('background-image', $('#mainImage').css('background-image')).css('background-size', fixWidth + 'px ' + fixHeight + 'px').show();

    // 사각형 좌표값
    var location = $(e).find('input[type=hidden]').val().split(',');
    x = parseInt(location[0]);
    y = parseInt(location[1]);
    textWidth = parseInt(location[2]);
    textHeight = parseInt(location[3]);
    //console.log("선택한 글씨: " + $(e).find('input[type=text]').val());

    //console.log("x: " + (x) + 'px y: ' + (y) + 'px');
    // 해당 텍스트 x y좌표 원본 이미지에서 찾기

    //var xPosition = (x * 0.4) > 0 ? '-' + ((x * 0.4) + 'px ') : (x * 0.4)  + 'px ';
    //var yPosition = (y * 0.4) > 0 ? '-' + ((y * 0.4) + 'px') : (y * 0.4) + 'px';

    var xPosition = ((- (x * widthPercent)) + 300) + 'px ';
    var yPosition = ((- (y * heightPercent)) + 200) + 'px';
    //console.log(xPosition + yPosition);
    $('#imageZoom').css('background-position', xPosition + yPosition);


    //실제 이미지 사이즈와 메인이미지div 축소율 판단
    //var reImg = new Image();
    //var imgPath = $('#mainImage').css('background-image').split('("')[1];
    //imgPath = imgPath.split('")')[0];
    //reImg.src = imgPath;
    //var width = reImg.width;
    //var height = reImg.height;

    // 선택한 글씨에 빨간 네모 그리기
    //$('#redNemo').css('top', ((y / (height / $('#mainImage').height())) + $('#imgHeader').height() + 22 + 42 - 10) + 'px');
    //$('#redNemo').css('left', ((x / (width / $('#mainImage').width())) + 22 + 99 - 10) + 'px');
    //$('#redNemo').css('width', ((textWidth / (width / $('#mainImage').width())) + 20) + 'px');
    //$('#redNemo').css('height', ((textHeight / (height / $('#mainImage').height())) + 20) + 'px');
    //$('#redNemo').show();
    //$('#redZoomNemo').css('width', '100%');
    $('#redZoomNemo').css('height', (textHeight + 5) + 'px');
    $('#redZoomNemo').show();
}

// 마우스 아웃 이벤트
function moutSquare(e) {
    //$('#redNemo').hide();
    $('#redZoomNemo').hide();
    $('#imageZoom').hide();
    $('#mainImage').show();
}

function viewOriginImg() {
    $('#imageZoom').hide();
    $('#mainImage').show();
}

function dbSelectClickEvent() {
    $('.selectBox > li').click(function (e) {
        if ($(this).children('ul').css('display') == 'none') {
            $('.selectBox > li').removeClass('on');
            $('.selectBox > li > ul').hide();
            $('.selectBox > li > ul').css('visibility', 'hidden').css('z-index', '0');
            $(this).addClass('on');
            $(this).children('ul').show();
            $(this).children('ul').css('visibility', 'visible').css('z-index', '1');
            $('.box_table_st').css('height', Number($('.box_table_st').height() + $(this).children('ul').height()) + 'px');
        } else {
            $(this).children('ul').hide();
            $(this).children('ul').css('visibility', 'hidden').css('z-index', '0');
            $('.box_table_st').css('height', Number($('.box_table_st').height() - $(this).children('ul').height()) + 'px');
        }
        e.preventDefault();
        e.stopPropagation();
    });
    $('.selectBox > li > ul > li').click(function (e) {
        if ($(this).children('ul').css('display') == 'none') {
            $('.selectBox > li > ul > li > ul').hide();
            $('.selectBox > li > ul > li > ul').css('visibility', 'hidden');
            $(this).children('ul').show();
            $(this).children('ul').css('visibility', 'visible').css('z-index', '2');
        } else {
            $(this).children('ul').hide();
            $(this).children('ul').css('visibility', 'hidden');
        }
        e.preventDefault();
        e.stopPropagation();
    });
    $('.selectBox > li > ul > li > ul > li').click(function (e) {
        var firstCategory = $(this).parent().prev().children('span').text();
        var lastCategory = ($(this).children('a').text() == '키워드') ? '' : ' 값';
        $(this).parent().parent().parent().prev().text(firstCategory);
        $(this).parent().parent().children('ul').hide();
        $(this).parent().parent().children('ul').css('visibility', 'hidden');
        $(this).parent().parent().parent().parent().children('ul').hide();
        $(this).parent().parent().parent().parent().children('ul').css('visibility', 'hidden').css('z-index', '0');
        $('.box_table_st').css('height', Number($('.box_table_st').height() - $(this).parent().parent().parent().parent().children('ul').height()) + 'px')
        e.preventDefault();
        e.stopPropagation();
    });
}

/*
function ocrBoxFocus() {
    $('#formImageZoom').mousedown(function (e) {
        console.log("마우스 누름: " + e.pageX + ', ' + e.pageY);
        mouseX = e.pageX;
        mouseY = e.pageY;
    }).mouseup(function (e) {
        var xDistance, yDistance;

        console.log("마우스 땜: " + e.pageX + ', ' + e.pageY);
        mouseMoveX = e.pageX;
        mouseMoveY = e.pageY;

        xDistance = mouseX - mouseMoveX;
        yDistance = mouseMoveY - mouseY;
        console.log("xDistance: " + xDistance + ", yDistance: " + yDistance);

        imageMove(xDistance, yDistance);
    });
}
*/

/*
// 마우스로 이미지 눌러 드래그시 이미지 이동
function imageMove(xDistance, yDistance) {

    var zoomDiv = document.getElementById("mainImage");
    var xResult, yResult;

    $('#redNemo').hide();

    xResult = x + xDistance;
    x = xResult;
    yResult = y - yDistance;
    y = yResult;
    zoomDiv.style.backgroundPosition = "-" + x + "px -" + y + "px";
}
*/

function uiTrainEvent() {
    $("#uiTrainBtn").click(function (e) {
        modifyTextData();
        /*
        var docData;
        if ($('#docData').val() != '') {
            docData = JSON.parse($('#docData').val());
        }
        if (docData && docData.DOCTYPE != 0) {
            modifyTextData();
        } else {
            fn_alert('alert', 'There is no document form, I do not training.');
            return;
        }
        */
    });
}

//개별 학습 학습 내용 추가 ui training add
function modifyTextData() {
    var beforeData = lineText;
    var afterData = [];
    var array = [];
    var dataCount = 0;
    beforeData = beforeData.slice(0);

    // afterData Processing
    $('#textResultTbl > dl').each(function (index, el) {
        var fileName = $(el).find('label').children().eq(2).val();
        var location = $(el).find('label').children().eq(1).val();
        var text = $(el).find('label').children().eq(0).val();
        var colLbl = $(el).find('select').find('option:selected').val();

        if (array.length < beforeData[dataCount].data.data.length) {
            array.push({ 'location': location, 'text': text, 'colLbl': Number(colLbl ? colLbl : 38) });
        }

        if (array.length == beforeData[dataCount].data.data.length) {
            var obj = {}
            obj.fileName = fileName;
            obj.data = array;
            afterData.push(obj);
            dataCount++;
            array = [];
        }

    });

    //afterData.fileName = $('#imageBox > .on span').text();
    /*
    $.ajax({
        url: '/uiLearning/uiTraining',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({
            'beforeData': beforeData[0].data,
            'afterData': afterData,
            'docType': $('#docType').val(),
            'docSid': $('#docSid').val()
        }),
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            //makeTrainingData();
            endProgressBar(progressId);
            fn_alert('alert', "success training");
        },
        error: function (err) {
            console.log(err);
            endProgressBar(progressId);
        }
    });
    */
    // find an array of data with the same filename
    for (var i in beforeData) {
        if (beforeData[i].fileName == afterData[i].fileName) {

            $.ajax({
                url: '/uiLearning/uiTraining',
                type: 'post',
                datatype: "json",
                data: JSON.stringify({
                    'beforeData': beforeData[i].data,
                    'afterData': afterData[i],
                    //'docType': $('#docType').val(),
                    //'docSid': $('#docSid').val()
                    'docType': lineText[i].data.docCategory.DOCTYPE,
                    'docSid': lineText[i].data.docSid
                }),
                contentType: 'application/json; charset=UTF-8',
                beforeSend: function () {
                    progressId = showProgressBar();
                },
                success: function (data) {
                    //makeTrainingData();
                    
                    if (beforeData.length - 1 == i) {
                        //endProgressBar(progressId);
                        setTimeout(function () {
                            endProgressBar(progressId);
                            fn_alert('alert', '학습이 완료 되었습니다.');
                        }, 5000);
                        //fn_alert('alert', "success training");
                    }
                },
                error: function (err) {
                    console.log(err);
                    endProgressBar(progressId);
                }
            });
        }
    }
}

function makeTrainingData() {
    var trainData = {};
    trainData.data = [];

    if (lineText[0] == null) {
        fn_alert('alert', "학습할 데이터가 없습니다.");
        return;
    }

    var dataArray = [];

    var tr = $("#textResultTbl dl");

    //console.log(td.eq(0).text());

    for (var i = 0; i < tr.length; i++) {
        var text = tr.eq(i).find('input[type="text"]').val();
        var location = tr.eq(i).find('input[type="hidden"]').val();
        var column = tr.eq(i).find('select option:selected').val();

        var obj = {}
        obj.text = text;
        obj.location = location;
        obj.colLbl = column;

        dataArray.push(obj);
    }

    var mlData = lineText[0].data.data;

    for (var i = 0; i < mlData.length; i++) {
        for (var j = 0; j < dataArray.length; j++) {
            if (mlData[i].location == dataArray[j].location) {

                if (dataArray[j].colLbl == 0 || dataArray[j].colLbl == 1 || dataArray[j].colLbl == 3) { // Only ogCompanyName, contractName, curCode
                    if (mlData[i].text != dataArray[j].text || mlData[i].colLbl != dataArray[j].colLbl) {
                        dataArray[j].sid = mlData[i].sid;
                        trainData.data.push(dataArray[j]);
                    }
                } else { // etc
                    if (mlData[i].colLbl != dataArray[j].colLbl) {
                        dataArray[j].text = mlData[i].text // origin text (Does not reflect changes made by users) 
                        dataArray[j].sid = mlData[i].sid;
                        trainData.data.push(dataArray[j]);
                    }
                }

                if (mlData[i].originText != null) {
                    dataArray[j].originText = mlData[i].originText;
                }

            }
        }
    }

    var data = {}
    data.data = dataArray;

    /*
    data.docCategory = JSON.parse($('#docData').val());
    
    trainData.docCategory = [];
    if (lineText[0].docCategory[0].DOCTYPE != data.docCategory.DOCTYPE) {
        trainData.docCategory.push(JSON.parse($('#docData').val()));
    } else {
        trainData.docCategory.push(lineText[0].docCategory[0]);
    }
    */
    //startProgressBar();
    //addProgressBar(1, 40);
    progressId = showProgressBar();
    callbackAddDocMappingTrain(trainData, progressId);
}

function insertTrainingData(data) {
    $('#progressMsgTitle').html('라벨 분류 학습 중..');
    //addProgressBar(21, 40);
    addLabelMappingTrain(data, callbackAddLabelMapping);
}

function callbackAddLabelMapping(data) {
    $('#progressMsgTitle').html('양식 분류 학습 중..');
    //addProgressBar(41, 60);
    addDocMappingTrain(data, callbackAddDocMappingTrain);
}

function callbackAddDocMappingTrain(data, progressId) {
    $('#progressMsgTitle').html('컬럼 맵핑 학습 중..');
    //addProgressBar(41, 80);
    function blackCallback() { }
    addColumnMappingTrain(data, blackCallback, progressId);
}


function uiTrainAjax() {
    $.ajax({
        url: '/batchLearning/uitraining',
        type: 'post',
        datatype: "json",
        data: null,
        contentType: 'application/json; charset=UTF-8',
        success: function (data) {
            if (data.code == 200) {
                addProgressBar(81, 100);
                fn_alert('alert', data.message);
                //popupEvent.batchClosePopup('retrain');
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
}

function insertTypoTrain(data, callback) {
    $.ajax({
        url: '/uiLearning/insertTypoTrain',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'data': data }),
        contentType: 'application/json; charset=UTF-8',
        success: function (res) {
            callback(res);
        },
        error: function (err) {
            console.log(err);
        }
    });
}

function addLabelMappingTrain(data, callback) {
    $.ajax({
        url: '/batchLearning/insertDocLabelMapping',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'data': data }),
        contentType: 'application/json; charset=UTF-8',
        success: function (res) {
            callback(res.data);
        },
        error: function (err) {
            console.log(err);
        }
    });
}

// 양식 레이블 매핑 ml 데이터 insert
function addDocMappingTrain(data, callback) {
    $.ajax({
        url: '/batchLearning/insertDocMapping',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'data': data }),
        contentType: 'application/json; charset=UTF-8',
        success: function (res) {
            console.log(res);
            callback(res.data);
        },
        error: function (err) {
            console.log(err);
        }
    });
}

function addColumnMappingTrain(data, callback, progressId) {

    $.ajax({
        url: '/batchLearning/insertColMapping',
        type: 'post',
        datatype: "json",
        data: JSON.stringify({ 'data': data }),
        contentType: 'application/json; charset=UTF-8',
        success: function (res) {
            console.log(res);
            fn_alert('alert', "success training");
            //addProgressBar(81, 100);
            //callback(data);
            endProgressBar(progressId);
        },
        error: function (err) {
            console.log(err);
            endProgressBar(progressId);

        }
    });
}

// layer1(문서양식조회 및 등록) 분류제외문장 선택시 수정
function editBannedword() {

    // 수정 중 포커스 잃었을 때
    $(document).on('focusout', '.editForm_bannedword', function () {
        var editVal = $(this).val();
        $(this).closest('td').html(editVal);
    });

    // td영역 클릭시 edit
    $(document).on('click', '.td_bannedword', function () {
        var bannedCheck = $(this).prev().find('.ui_layer1_result_chk').is(':checked');
        var isInputFocus = $(this).children('input').is(":focus");
        if (bannedCheck && isInputFocus == false) {
            var originVal = $(this).html();
            var editInputHtml = '<input type="text" class="editForm_bannedword" value="' + originVal + '">';
            $(this).empty().append(editInputHtml).children('input').focus();
        }
    })

    // 개별체크
    $(document).on('click', '.ui_layer1_result_chk', function () {
        if ($(this).is(':checked')) {
            var $editTd = $(this).closest('td').next();
            var originVal = $editTd.html();
            var editInputHtml = '<input type="text" class="editForm_bannedword" value="' + originVal + '">';
            $editTd.empty().append(editInputHtml).children('input').focus();

        }
    });

    // 모두체크
    $('#allCheckClassifySentenses').click(function () {
        var isCheck = $(this).is(':checked');

        if (isCheck) {
            $('.ui_layer1_result_chk').prop('checked', true);
            $('.ui_layer1_result_chk').closest('.ez-checkbox').addClass('ez-checked');

        } else {
            $('.ui_layer1_result_chk').prop('checked', false);
            $('.ui_layer1_result_chk').closest('.ez-checkbox').removeClass('ez-checked');
        }

    });
}

// 문서 양식 조회 이미지 좌우 버튼 이벤트
function changeDocPopupImage() {
    $('#docSearchResultImg_thumbPrev').click(function () {
        $('#docSearchResultImg_thumbNext').attr('disabled', false);
        if (docPopImagesCurrentCount == 1) {
            return false;
        } else {
            docPopImagesCurrentCount--;
            $('#countCurrent').html(docPopImagesCurrentCount);
            $('#orgDocName').val(docPopImages[docPopImagesCurrentCount - 1].DOCNAME);
            $('#searchResultDocName').val(docPopImages[docPopImagesCurrentCount - 1].DOCNAME);
            $('#searchResultImg').attr('src', '/sample/' + docPopImages[docPopImagesCurrentCount - 1].SAMPLEIMAGEPATH);
            if (docPopImagesCurrentCount == 1) {
                $('#docSearchResultImg_thumbPrev').attr('disabled', true);
            } else {
                $('#docSearchResultImg_thumbPrev').attr('disabled', false);
            }
        }
    });

    $('#docSearchResultImg_thumbNext').click(function () {
        var totalCount = $('#countLast').html();
        $('#docSearchResultImg_thumbPrev').attr('disabled', false);
        if (docPopImagesCurrentCount == totalCount) {
            return false;
        } else {
            docPopImagesCurrentCount++;
            $('#countCurrent').html(docPopImagesCurrentCount);
            $('#orgDocName').val(docPopImages[docPopImagesCurrentCount - 1].DOCNAME);
            $('#searchResultDocName').val(docPopImages[docPopImagesCurrentCount - 1].DOCNAME);
            $('#searchResultImg').attr('src', '/sample' + docPopImages[docPopImagesCurrentCount - 1].SAMPLEIMAGEPATH);
            if (docPopImagesCurrentCount == totalCount) {
                $('#docSearchResultImg_thumbNext').attr('disabled', true);
            } else {
                $('#docSearchResultImg_thumbNext').attr('disabled', false);
            }
        }
    });
}

// 문서 양식 조회 이미지 좌우 버튼 이벤트
function changeOcrDocPopupImage() {
    var totalImgCount = lineText.length - 1;
    currentImgCount = 0;

    $('#ocrResultImg_thumbPrev').click(function () {
        $('#docSearchResultImg_thumbNext').attr('disabled', false);
        if (currentImgCount == 0) {
            return false;
        } else {
            currentImgCount--;
            var appendImg = '<img id="originImg" src="/tif/' + lineText[currentImgCount].fileName + '">'
            $('#originImgDiv').html(appendImg);
            selectClassificationStOcr('', currentImgCount);
            if (currentImgCount == 0) {
                $('#docSearchResultImg_thumbPrev').attr('disabled', true);
            } else {
                $('#docSearchResultImg_thumbPrev').attr('disabled', false);
            }
        }
    });

    $('#ocrResultImg_thumbNext').click(function () {
        $('#docSearchResultImg_thumbPrev').attr('disabled', false);
        if (currentImgCount == totalImgCount) {
            return false;
        } else {
            currentImgCount++;
            var appendImg = '<img id="originImg" src="/tif/' + lineText[currentImgCount].fileName + '">'
            $('#originImgDiv').html(appendImg);
            selectClassificationStOcr('', currentImgCount);
            if (currentImgCount == totalImgCount) {
                $('#docSearchResultImg_thumbNext').attr('disabled', true);
            } else {
                $('#docSearchResultImg_thumbNext').attr('disabled', false);
            }
        }
    });
}

// 분류제외문장 조회
function selectClassificationStOcr(filepath, currentImgCount) {

    var param = {
        filepath: filepath
    };
    var resultOcrData = '';
    $.ajax({
        //todo
        url: '/batchLearning/selectClassificationSt',
        type: 'post',
        datatype: "json",
        data: JSON.stringify(param),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function () {
            //addProgressBar(1, 99);
        },
        success: function (data) {
            //console.log("SUCCESS selectClassificationSt : " + JSON.stringify(data));
            if (data.code != 500 || data.data != null) {

                var ocrdata = lineText[currentImgCount].data.data;

                //순서 정렬 로직
                let tempArr = new Array();
                for (let item in ocrdata) {
                    tempArr[item] = new Array(makeindex(ocrdata[item].location), ocrdata[item]);
                }

                tempArr.sort(function (a1, a2) {
                    a1[0] = parseInt(a1[0]);
                    a2[0] = parseInt(a2[0]);
                    return (a1[0] < a2[0]) ? -1 : ((a1[0] > a2[0]) ? 1 : 0);
                });

                for (let i = 0; i < tempArr.length; i++) {

                    var bannedCheck = true;
                    for (let j = 0; j < data.bannedData.length; j++) {
                        if (tempArr[i][1].text.toLowerCase().indexOf(data.bannedData[j].WORD) == 0) {
                            bannedCheck = false;
                            break;
                        }
                    }

                    if (bannedCheck) {
                        resultOcrData += '<tr class="ui_layer1_result_tr">';
                        resultOcrData += '<td><input type="checkbox" class="ui_layer1_result_chk"></td>';
                        resultOcrData += '<td class="td_bannedword">' + tempArr[i][1].text + '</td></tr>';
                    } else {
                        resultOcrData += '<tr class="ui_layer1_result_tr">';
                        resultOcrData += '<td><input type="checkbox" checked="checked" class="ui_layer1_result_chk"></td>';
                        resultOcrData += '<td class="td_bannedword">' + tempArr[i][1].text + '</td></tr>';
                    }

                }
                $('#ui_layer1_result').empty().append(resultOcrData);
                $('input[type=checkbox]').ezMark();

            }

        },
        error: function (err) {
            console.log(err);
        }
    })
}
$(document).on('click', '#docCompareBtn',function(){
    var text1 = [{"location":"121,202,615,40","text":"Migros-Genossenschafts-Bund"},{"location":"1642,132,543,100","text":"MIGROS"},{"location":"121,512,199,22","text":"Bestellnummer:"},{"location":"121,566,174,22","text":"Bestelldatum:"},{"location":"501,497,212,37","text":"14384281"},{"location":"498,557,207,32","text":"20.12.2017"},{"location":"499,811,225,22","text":"Produktbeschrieb"},{"location":"499,860,56,22","text":"EAN"},{"location":"1632,502,141,32","text":"Seite 2/"},{"location":"1808,503,20,30","text":"2"},{"location":"121,811,54,22","text":"pos."},{"location":"121,947,38,28","text":"10"},{"location":"213,811,80,22","text":"Artikel"},{"location":"215,860,133,22","text":"Lief.art.Nr."},{"location":"1502,811,175,28","text":"Bestellmenge"},{"location":"1590,860,88,22","text":"Einheit"},{"location":"1617,947,59,28","text":"100"},{"location":"215,947,817,36","text":"772223500000 Samsung HW-M360 Soundbar"},{"location":"216,1007,553,29","text":"HW-M360/EN 8806088679716"},{"location":"205,1068,448,28","text":"Kontraktnummer 21119331"},{"location":"1725,811,213,27","text":"Preis pro Einheit"},{"location":"1849,860,86,22","text":"CU/TU"},{"location":"1824,947,108,28","text":"181.61"},{"location":"1846,1008,90,28","text":"1 .ooo"},{"location":"1832,1168,83,32","text":"Cl-IF"},{"location":"1797,3353,141,16","text":"P12 / 550 / 025"},{"location":"2118,810,126,29","text":"VP (CHF)"},{"location":"2158,860,85,22","text":"CU/LU"},{"location":"2154,1008,89,28","text":"1 .ooo"},{"location":"2048,1169,182,37","text":"18,161.oo"},{"location":"122,1169,220,31","text":"Bestelltotal"},{"location":"122,1367,613,39","text":"Migros-Genossenschafts-Bund"},{"location":"119,1417,359,36","text":"Zrich, 20.12.2017"}];
    var text11 = JSON.parse(JSON.stringify(text1));
    var text2 = [{"location":"298,202,615,40","text":"Migros-Genossenschafts-Bund"},{"location":"298,557,748,40","text":"Samsung Electronics Switzerland GmbH"},{"location":"299,606,398,32","text":"Giesshbelstrasse 30"},{"location":"298,656,217,31","text":"8045 Zrich"},{"location":"300,1182,444,55","text":"Lagerbestellung"},{"location":"1642,132,544,100","text":"MIGROS"},{"location":"1632,557,430,29","text":"Migros-Genossenschafs-Bund"},{"location":"1632,599,245,22","text":"Limmatstrasse 152"},{"location":"1632,640,185,22","text":"Postfach 1766"},{"location":"1631,681,204,23","text":"CH-8031 ZOrich"},{"location":"1631,722,373,29","text":"Telefon +41 (0) 44 277 21 11"},{"location":"1632,805,469,22","text":"MwSt-Nr.: CHE-105.829.940 MWST"},{"location":"1633,1300,140,31","text":"Seite 1 /"},{"location":"1808,1300,20,30","text":"2"},{"location":"298,1321,199,22","text":"Bestellnummer:"},{"location":"298,1375,199,22","text":"Lieferanten-Nr. :"},{"location":"298,1430,174,22","text":"Bestelldatum:"},{"location":"297,1538,236,22","text":"Sachbearbeiter/In:"},{"location":"298,1593,140,22","text":"Direktwahl:"},{"location":"298,1647,87,22","text":"E-Mail:"},{"location":"296,1701,210,23","text":"Telefon Einkauf:"},{"location":"296,1755,102,23","text":"Telefax:"},{"location":"298,1918,306,23","text":"Liefertermin eintreffend:"},{"location":"298,1973,181,22","text":"Lieferadresse:"},{"location":"298,2082,186,28","text":"Logistikklasse:"},{"location":"298,2136,206,22","text":"Incoterms 2010:"},{"location":"298,2190,281,23","text":"Liefertermin Incotem:"},{"location":"296,2300,276,28","text":"Zahlungskonditionen:"},{"location":"297,2404,103,28","text":"Wichtig:"},{"location":"714,1306,212,36","text":"14384281"},{"location":"714,1366,180,31","text":"10030394"},{"location":"711,1420,206,31","text":"20.12.2017"},{"location":"713,1530,260,30","text":"Ronald Lumor"},{"location":"712,1584,376,38","text":"+41 (0) 44 277 27 61"},{"location":"713,1638,436,39","text":"Ronald.Lumor@mgb.ch"},{"location":"712,1692,379,39","text":"+41 (0) 44 277 36 51"},{"location":"714,1910,203,30","text":"10.01 .2018"},{"location":"713,1964,467,31","text":"MVN - Betrieb Neuendorf"},{"location":"710,2019,301,30","text":"4623 Neuendorf"},{"location":"713,2074,105,38","text":"Lager"},{"location":"713,2127,676,39","text":"DDP Migros Lager/Depot/Stock DDP"},{"location":"713,2182,205,31","text":"10.01.2018"},{"location":"711,2291,255,39","text":"30 Tage netto"},{"location":"712,2394,1553,40","text":"Bitte vermerken Sie auf all unseren Dokumenten (Rechnung,Lieferschein etc.)"},{"location":"712,2444,944,38","text":"unsere Bestell-, Kontrakt-, und Artikelnummern."},{"location":"710,2543,1252,40","text":"Terminverschiebungen sind unverzglich dem oben erwhnten"},{"location":"709,2593,561,39","text":"Ansprechpartner zu melden."}];
    var text22 = JSON.parse(JSON.stringify(text2));

    var data1 = {
        data: [{colLbl: -1,
            location: "1642,132,544,100",
            mappingSid: "4,1642,132,2186,99567,0,0,0,0",
            originText: "MIGROS",
            sid: "99567,0,0,0,0",
            text: "MIGROS"}, {entryLbl: "221",
            location: "298,202,615,40",
            mappingSid: "4,298,202,913,99577,0,0,0,0",
            originText: "Migros-Genossenschafts-Bund",
            sid: "99577,0,0,0,0",
            text: "Migros-Genossenschafts-Bund"}
        ],
        docCategory: {
            DOCNAME: "Migros",
            DOCSOCRE: 0.99,
            DOCTOPTYPE: 37,
            DOCTYPE: 4,
            SAMPLEIMAGEPATH: "/sampleDocImage/14409732-0.png",
            SEQNUM: 213
        },
        fileinfo: {
            filepath: "C:/ICR/uploads/14384281-0.png",
            imgId: "201901172245871000000"
        },
        labelData: [{ENGNM: "Not Entry", KORNM: null, SEQNUM: "220", DOCID: "37", AMOUNT: "not"}, {ENGNM: "Buyer", KORNM: null, SEQNUM: "221", DOCID: "37", AMOUNT: "single"},
                {ENGNM: "PO Number", KORNM: null, SEQNUM: "222", DOCID: "37", AMOUNT: "single"}, {ENGNM: "PO Date", KORNM: null, SEQNUM: "223", DOCID: "37", AMOUNT: "single"},
                {ENGNM: "Delivery Address", KORNM: null, SEQNUM: "224", DOCID: "37", AMOUNT: "single"}, {ENGNM: "Total Price", KORNM: null, SEQNUM: "226", DOCID: "37", AMOUNT: "single"},
                {ENGNM: "Currency", KORNM: null, SEQNUM: "227", DOCID: "37", AMOUNT: "single"}, {ENGNM: "Material", KORNM: null, SEQNUM: "228", DOCID: "37", AMOUNT: "multi"},
                {ENGNM: "EAN", KORNM: null, SEQNUM: "229", DOCID: "37", AMOUNT: "multi"}, {ENGNM: "Requested Delivery Date", KORNM: null, SEQNUM: "230", DOCID: "37", AMOUNT: "single"},
                {ENGNM: "Quantity", KORNM: null, SEQNUM: "231", DOCID: "37", AMOUNT: "multi"}, {ENGNM: "Unit Price", KORNM: null, SEQNUM: "232", DOCID: "37", AMOUNT: "multi"},
                {ENGNM: "Item Total", KORNM: null, SEQNUM: "233", DOCID: "37", AMOUNT: "multi"}, {ENGNM: "Serial Number", KORNM: null, SEQNUM: "234", DOCID: "37", AMOUNT: "multi"}
        ]
    };

    var data2 = {
        data: text22,
        docCategory: {
            DOCNAME: "Migros",
            DOCSOCRE: 0.99,
            DOCTOPTYPE: 37,
            DOCTYPE: 4,
            SAMPLEIMAGEPATH: "/sampleDocImage/14409732-0.png",
            SEQNUM: 213
        },
        fileinfo: {
            filepath: "C:/ICR/uploads/14384281-0.png",
            imgId: "201901172245871000000"
        },
        labelData: [{ENGNM: "Not Entry", KORNM: null, SEQNUM: "220", DOCID: "37", AMOUNT: "not"}, {ENGNM: "Buyer", KORNM: null, SEQNUM: "221", DOCID: "37", AMOUNT: "single"},
                {ENGNM: "PO Number", KORNM: null, SEQNUM: "222", DOCID: "37", AMOUNT: "single"}, {ENGNM: "PO Date", KORNM: null, SEQNUM: "223", DOCID: "37", AMOUNT: "single"},
                {ENGNM: "Delivery Address", KORNM: null, SEQNUM: "224", DOCID: "37", AMOUNT: "single"}, {ENGNM: "Total Price", KORNM: null, SEQNUM: "226", DOCID: "37", AMOUNT: "single"},
                {ENGNM: "Currency", KORNM: null, SEQNUM: "227", DOCID: "37", AMOUNT: "single"}, {ENGNM: "Material", KORNM: null, SEQNUM: "228", DOCID: "37", AMOUNT: "multi"},
                {ENGNM: "EAN", KORNM: null, SEQNUM: "229", DOCID: "37", AMOUNT: "multi"}, {ENGNM: "Requested Delivery Date", KORNM: null, SEQNUM: "230", DOCID: "37", AMOUNT: "single"},
                {ENGNM: "Quantity", KORNM: null, SEQNUM: "231", DOCID: "37", AMOUNT: "multi"}, {ENGNM: "Unit Price", KORNM: null, SEQNUM: "232", DOCID: "37", AMOUNT: "multi"},
                {ENGNM: "Item Total", KORNM: null, SEQNUM: "233", DOCID: "37", AMOUNT: "multi"}, {ENGNM: "Serial Number", KORNM: null, SEQNUM: "234", DOCID: "37", AMOUNT: "multi"}
        ]
    }
    var data = {data: [data1, data2]};

    fn_viewDoctypePop(data);
})
function fn_viewDoctypePop(obj) {
    //20180910 filepath로 ocr 데이터 조회 후 text값만 가져올 것
	//console.log(modifyData);
	var data = obj.data[0];
	layer4Data = obj.data[0];
	var filepath = data.fileinfo.filepath;
	var imgId = data.fileinfo.imgId;
    //var rowIdx = $(obj).closest('tr').attr('id').split('_')[1];
	var fileName = nvl(filepath.substring(filepath.lastIndexOf('/') + 1));
	var mlDocName = data.docCategory.DOCNAME;
	var mlPercent = data.docCategory.DOCSCORE;

	console.log("filepath : " + filepath);
	console.log("imgId : " + imgId);
	console.log("fileName : " + fileName);
	console.log("mlDocName : " + mlDocName);
	console.log("mlPercent : " + mlPercent);

    //$('#batchListRowNum').val(rowIdx);
    $('#docPopImgId').val(imgId);
	$('#docPopImgPath').val(filepath);
	
    initLayer4();
    selectClassificationSt(filepath); // 분류제외문장 렌더링
    //$('#mlPredictionDocName').val('UNKNOWN');
	//var filename = filename.split('.')[0];
    var appendPngHtml = '';
    //if(imgCount == 1) {
		//var pngName = fileName + '.png';
		appendPngHtml += '<img src="/img/' + fileName +'" id="originImg">';
    //} else {

    //    for(var i = 0; i < imgCount; i++) {
    //        var pngName = filename + '-' + i + '.png';
    //        appendPngHtml += '<img src="/img/' + pngName +'" style="width: 100%; height: auto; margin-bottom: 20px;">';
    //    }
	//}
	//$('#div_view_image').empty().append(appendPngHtml);
	$('#originImgDiv').empty().append(appendPngHtml);
	$('#mlPredictionDocName').val(mlDocName);
	$('#mlPredictionPercent').val(mlPercent);
	//$('#mlData').val(data);
	$('#imgNumIpt').val(1);
	$('#imgTotalCnt').html(1);
	
	layer_open('layer4');
	$('#div_view_image').scrollTop(0);

}

function initLayer4() {
    $('#originImgDiv').empty();
    $('#mlPredictionDocName').val('');
    $('#docSearchResultImg_thumbCount').hide();
    $('#docSearchResultMask').hide();
    $('#countCurrent').empty();
    $('#countLast').empty();
    $('#mlPredictionPercent').val('');
    $('#orgDocSearchRadio').click();
    $('.ui_doc_pop_ipt').val('');
    $('#docSearchResult').empty();
    $('#searchResultDocName').val('');
    $('#searchDocCategoryKeyword').val('');
    $('#batch_layer4_result').empty();
    $('#allCheckClassifySentenses').prop('checked', false);
    $('#allCheckClassifySentenses').closest('.ez-checkbox').removeClass('ez-checked');
}