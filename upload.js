//decryption function
//data can also be pulled from jQuery if needed
//no need to pass the sec key in the function, but it is as an option
function decryptDES(data, sec_key) {
    return CryptoJS.AES.decrypt(data, sec_key).toString(CryptoJS.enc.Utf8)
}

function encryptDES(data, sec_key) {
    return CryptoJS.AES.encrypt(data, sec_key).toString()
}

const host = 'https://pi-ip.oss-accelerate.aliyuncs.com';
g_dirname = 'upload/'
g_object_name = ''
g_object_name_type = ''
now = timestamp = Date.now() / 1000;

const accessKey = 'LTAI4GKnAjwiBTyBxM9VAM4V';
const policyBase64 = 'ewogICAgImV4cGlyYXRpb24iOiAiMzA1MC0wNC0xOVQwMjo1Nzo1MS4wMDBaIiwKICAgICJjb25kaXRpb25zIjogWwogICAgICAgIFsKICAgICAgICAgICAgImNvbnRlbnQtbGVuZ3RoLXJhbmdlIiwKICAgICAgICAgICAgMCwKICAgICAgICAgICAgMTA0ODU3NjAwMAogICAgICAgIF0KICAgIF0KfQ=='
const ciphertext = "U2FsdGVkX1+XPkdRZynO91z4qW7zUDhAFd2epbjy/8EoUMWpaIwvg2R4PlRPe7XW"
const signature = decryptDES(ciphertext, prompt('请输入密码:'))

function check_object_radio() {
    g_object_name_type = 'local_name';
}

function get_dirname() {
}

function random_string(len) {
    len = len || 32;
    var chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
    var maxPos = chars.length;
    var pwd = '';
    for (i = 0; i < len; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
}

function get_suffix(filename) {
    pos = filename.lastIndexOf('.')
    suffix = ''
    if (pos != -1) {
        suffix = filename.substring(pos)
    }
    return suffix;
}

function calculate_object_name(filename) {
    if (g_object_name_type == 'local_name') {
        g_object_name += "${filename}"
    } else if (g_object_name_type == 'random_name') {
        suffix = get_suffix(filename)
        g_object_name = g_dirname + random_string(10) + suffix
    }
    return ''
}

function get_uploaded_object_name(filename) {
    if (g_object_name_type == 'local_name') {
        tmp_name = g_object_name
        tmp_name = tmp_name.replace("${filename}", filename);
        return tmp_name
    } else if (g_object_name_type == 'random_name') {
        return g_object_name
    }
}

function set_upload_param(uploader, filename, ret) {
    g_object_name = g_dirname;
    if (filename != '') {
        suffix = get_suffix(filename)
        calculate_object_name(filename)
    }
    new_multipart_params = {
        'key': g_object_name,
        'policy': policyBase64,
        'OSSAccessKeyId': accessKey,
        'success_action_status': '200', //让服务端返回200,不然，默认会返回204
        'signature': signature,
    };

    uploader.setOption({
        'url': host,
        'multipart_params': new_multipart_params
    });

    uploader.start();
}

function genId() {
    return Number(Math.random().toString().substr(3, 10) + Date.now()).toString(36);
}

var prompt = function (message, style, time) {
    style = (style === undefined) ? 'alert-success' : style;
    time = (time === undefined) ? 120000 : time;
    $('<div>')
        .appendTo('body')
        .addClass('alert ' + style)
        .html(message)
        .show()
        .delay(time)
        .fadeOut();
};

// 成功提示
var success_prompt = function (message, time) {
    prompt(message, 'alert-success', time);
}

function copyText(id) {
    var node = document.getElementById(id);
    node.focus();
    node.setSelectionRange(0, node.value.length);
    document.execCommand('copy', true);
    success_prompt('复制成功', 500)
}

function openUrl(input) {
    window.open(input.value, '_black');
    return false;
}

var uploader = new plupload.Uploader({
    runtimes: 'html5,flash,silverlight,html4',
    browse_button: 'input-files',
    drop_element: 'drop-zone',
    multi_selection: true,
    //container: document.getElementById('container'),
    flash_swf_url: 'lib/plupload-2.1.2/js/Moxie.swf',
    silverlight_xap_url: 'lib/plupload-2.1.2/js/Moxie.xap',
    url: 'http://oss.aliyuncs.com',

    init: {
        PostInit: function () {
            //document.getElementById('ossfile').innerHTML = '';
            // document.getElementById('postfiles').onclick = function () {
            //     set_upload_param(uploader, '', false);
            //     return false;
            // };
        },

        FilesAdded: function (up, files) {
            plupload.each(files, function (file) {
                document.getElementById('progress').innerHTML += '<div class="well"><div id="' + file.id + '">' + file.name + ' (' + plupload.formatSize(file.size) + ')<b></b>'
                    + '<div class="progress"><div class="progress-bar" style="width: 0%"></div></div>'
                    + '</div></div>';
                document.getElementById('input-files').value += file.name + ' ';
            });
        },

        BeforeUpload: function (up, file) {
            check_object_radio();
            get_dirname();
            set_upload_param(up, file.name, true);
        },

        UploadProgress: function (up, file) {
            var d = document.getElementById(file.id);
            d.getElementsByTagName('b')[0].innerHTML = '<span>' + file.percent + "%</span>";
            var prog = d.getElementsByTagName('div')[0];
            var progBar = prog.getElementsByTagName('div')[0]
            progBar.style.width = file.percent + '%';
            progBar.setAttribute('aria-valuenow', file.percent);
        },

        FileUploaded: function (up, file, info) {
            var html = "";
            var url = host + '/' + get_uploaded_object_name(file.name);
            if (info.status == 200) {
                var id = genId();

                html = '<div class="input-group">\n' +
                    '<span class="input-group-addon">' + file.name + '</span>\n' +
                    '<input id="' + id + '" type="text" class="form-control" value="' + url + '" onclick="openUrl(this)">\n' +
                    '<span class="input-group-addon" onclick="copyText(\'' + id + '\')">复制</span>\n' +
                    '</div>'

            } else {
                html = '<a href="' + url + '" class="list-group-item list-group-item-success">' +
                    '<span class="badge alert-danger pull-right">Failed</span>' +
                    file.name +
                    '</a>';
            }
            document.getElementById('finishedFiles').innerHTML += html;
        },

        Error: function (up, err) {
            document.getElementById('console').appendChild(document.createTextNode("\nError xml:" + err.response));
        }
    }
});

uploader.init();
