// Generated by CoffeeScript 1.7.1
(function() {
  var Cookies, GIGABYTE, History, addFile, api, currentPage, downloadUrl, files, gigabytes, gigabytes_ratio, initFilePages, loadStats, makeHandler, pageCount, percentage, pickFilePage, pickPagination, selectElementText, showUploadStage, uploadFile, uploadFiles;

  api = function(resource) {
    return 'http://node2.storj.io/api/' + resource;
  };

  GIGABYTE = 1024 * 1024 * 1024;

  Cookies = {
    set: (function(k, v, days) {
      var date, expires, secs;
      if (days) {
        date = new Date();
        secs = days * 24 * 60 * 60 * 1000;
        date.setTime(date.getTime() + secs);
        expires = '; expires=' + date.toGMTString() + '; max-age=' + secs;
      } else {
        expires = '';
      }
      return document.cookie = k + '=' + v + expires + '; path=/';
    }),
    get: (function(k) {
      var cookie, cookies, index, name, v, _i, _len, _ref;
      cookies = document.cookie.split(';');
      for (_i = 0, _len = cookies.length; _i < _len; _i++) {
        cookie = cookies[_i];
        cookie = cookie.trim();
        index = cookie.indexOf('=');
        _ref = [cookie.substring(0, index), cookie.substring(index + 1)], name = _ref[0], v = _ref[1];
        if (name === k) {
          return v;
        }
      }
      return null;
    }),
    kill: (function(k) {
      return this.set(k, '', -11);
    })
  };

  History = {
    add: (function(file) {
      var stuff;
      stuff = JSON.parse(Cookies.get('history')) || [];
      stuff.unshift(file);
      return Cookies.set('history', JSON.stringify(stuff));
    }),
    get: (function() {
      return JSON.parse(Cookies.get('history'));
    }),
    kill: (function() {
      return Cookies.kill('history');
    })
  };

  gigabytes = function(bytes) {
    return (bytes / GIGABYTE).toFixed(2) + ' GB';
  };

  gigabytes_ratio = function(bytes, total) {
    if (total === 0) {
      return (bytes / GIGABYTE).toFixed(2) + '/&infin; GB';
    } else {
      return (bytes / GIGABYTE).toFixed(2) + '/' + gigabytes(total);
    }
  };

  percentage = function(bytes, total) {
    if (total === 0) {
      return '0%';
    } else {
      return (100 * bytes / total) + '%';
    }
  };

  loadStats = function() {
    return $.getJSON(api('status'), function(info) {
      $('#cont-file-size-limit').html(gigabytes(info.storage.max_file_size));
      $('#bar-ul-bandwidth').css('width', percentage(info.bandwidth.current.incoming, info.bandwidth.limits.incoming));
      $('#cont-ul-bandwidth').html(gigabytes_ratio(info.bandwidth.current.incoming, info.bandwidth.limits.incoming));
      $('#bar-dl-bandwidth').css('width', percentage(info.bandwidth.current.outgoing, info.bandwidth.limits.outgoing));
      $('#cont-dl-bandwidth').html(gigabytes_ratio(info.bandwidth.current.outgoing, info.bandwidth.limits.outgoing));
      $('#bar-storage').css('width', percentage(info.storage.used, info.storage.capacity));
      $('#cont-storage').text(gigabytes_ratio(info.storage.used, info.storage.capacity));
      $('#cont-datacoin-bal').text(info.datacoin.balance + ' DTC');
      $('#cont-datacoin-addr').html('<code>' + info.datacoin.address + '</code>').find('code').click(function() {
        return selectElementText($(this)[0]);
      });
      $('#cont-sync-cloud').text(info.sync.cloud_queue.count + ' (' + gigabytes(info.sync.cloud_queue.size) + ')');
      return $('#cont-sync-blockchain').text(info.sync.blockchain_queue.count + ' (' + gigabytes(info.sync.blockchain_queue.size) + ')');
    });
  };

  loadStats();

  showUploadStage = function(stage) {
    $('#cont-upload').hide();
    $('#cont-uploaded').hide();
    $('#cont-uploading').hide();
    return $('#cont-' + stage).show();
  };

  selectElementText = function(el, win) {
    var doc, range, sel;
    win = win || window;
    doc = win.document;
    if (win.getSelection && doc.createRange) {
      sel = win.getSelection();
      range = doc.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      return sel.addRange(range);
    } else if (doc.body.createTextRange) {
      range = doc.body.createTextRange();
      range.moveToElementText(el);
      return range.select();
    }
  };

  downloadUrl = function(file) {
    return api('download/' + file.hash);
  };

  addFile = function(file) {
    var $file;
    $file = $('<div/>').addClass('file-row cf').append($('<div/>').addClass('left').append('<div class="name">' + file.fname + '</div>').append('<div class="hash"><code>' + file.fhash + '</code></div>')).append($('<div/>').addClass('right').append('<button class="btn btn-dl"><i class="fa fa-download"></i>Download</button>')).append($('<div/>').addClass('right').append('<button class="btn btn-copy-url"><i class="fa fa-clipboard"></i>Copy URL</button>')).appendTo($('#cont-file-list'));
    $file.find('button.btn-dl').click(function() {
      return window.location.href = downloadUrl(file);
    });
    $file.find('button.btn-copy-url').zclip({
      path: '/js/ZeroClipboard.swf',
      copy: function() {
        return downloadUrl(file);
      }
    });
    return $file.find('code').zclip({
      path: '/js/ZeroClipboard.swf',
      copy: function() {
        return $(this).html();
      }
    });
  };

  makeHandler = function(fname) {
    return function(response) {
      var file, page;
      file = {
        fname: fname,
        fhash: response.filehash
      };
      History.add(file);
      showUploadStage('uploaded');
      $('#span-dl-link').val(downloadUrl(file));
      page = currentPage();
      initFilePages();
      pickFilePage(page);
      return loadStats();
    };
  };

  $('#in-upload').change(function() {
    return uploadFiles(this.files);
  });

  uploadFiles = function(files) {
    var file, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = files.length; _i < _len; _i++) {
      file = files[_i];
      _results.push(uploadFile(file));
    }
    return _results;
  };

  uploadFile = function(file) {
    var fname, formData, progressHandler;
    fname = file.name;
    formData = new FormData();
    formData.append('file', file);
    showUploadStage('uploading');
    $('#span-up-prog').css('width', '0%').text('0%');
    progressHandler = function(e) {
      var perc;
      perc = e.loaded / e.total * 100;
      return $('#span-up-prog').css('width', perc + '%').text(Math.round(perc) + '%');
    };
    return $.ajax({
      url: api('upload'),
      type: 'POST',
      xhr: (function() {
        var xhr;
        xhr = $.ajaxSettings.xhr();
        if (xhr.upload) {
          xhr.upload.addEventListener('progress', progressHandler, false);
        }
        return xhr;
      }),
      data: formData,
      cache: false,
      contentType: false,
      processData: false,
      success: makeHandler(fname)
    });
  };

  $('body').on('dragenter', (function(e) {
    e.preventDefault();
    return e.stopPropagation();
  }));

  $('body').on('dragover', (function(e) {
    e.preventDefault();
    return e.stopPropagation();
  }));

  $('body').on('drop', (function(e) {
    uploadFiles(e.originalEvent.dataTransfer.files);
    e.preventDefault();
    return e.stopPropagation();
  }));

  $('.searchbox input[name=search]').keypress(function(e) {
    if (e.which === 13) {
      return window.location.href = api('download/' + $(e.target).val());
    }
  });

  $('#span-dl-link').focus(function() {
    return $(this).select();
  });

  $('#span-dl-link').click(function() {
    return $(this).select();
  });

  $('#btn-upload-another').click(function() {
    return showUploadStage('upload');
  });

  files = History.get();

  currentPage = function() {
    return parseInt($('#cont-pagination').attr('data-current')) | 0;
  };

  pageCount = function() {
    return parseInt((History.get().length + 9) / 10);
  };

  pickPagination = function(page) {
    $('#cont-pagination').attr('data-current', page);
    return $('#cont-pagination button').each(function() {
      var found;
      found = false;
      if (!isNaN($(this).attr('data-id'))) {
        if (parseInt($(this).attr('data-id')) === page) {
          found = true;
        }
      }
      return $(this).prop('disabled', found);
    });
  };

  pickFilePage = function(page) {
    var file, _i, _len, _ref;
    if (page === "next") {
      page = Math.min(currentPage() + 1, pageCount() - 1);
    }
    if (page === "prev") {
      page = Math.max(0, currentPage() - 1);
    }
    page = parseInt(page);
    $('#cont-file-list').empty();
    _ref = History.get().slice(page * 10, (page + 1) * 10);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      file = _ref[_i];
      addFile(file);
    }
    return pickPagination(page);
  };

  initFilePages = function() {
    var $cont, i, _i, _ref;
    $cont = $('#cont-pagination');
    $cont.empty();
    $cont.append('<button data-id="prev" type="button" class="btn btn-default"><i class="fa fa-arrow-circle-left"></i></button>');
    for (i = _i = 0, _ref = pageCount(); 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      $cont.append('<button data-id="' + i + '" type="button" class="btn btn-default">' + (i + 1) + '</button>');
    }
    $cont.append('<button data-id="next" type="button" class="btn btn-default"><i class="fa fa-arrow-circle-right"></i></button>');
    $cont.find('button').click(function() {
      return pickFilePage($(this).attr('data-id'));
    });
    return pickFilePage(0);
  };

  initFilePages();

}).call(this);
