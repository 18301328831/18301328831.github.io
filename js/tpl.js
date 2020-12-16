var TPL = function (params) {

    this.create = function(){
        this.el = params.el;
        for (x in  params.data) {
            this[x] = params.data[x];
        }
        for (method in  params.methods) {
            this[method] = params.methods[method];
        }
    }

    this.replaceModel= function () {

        this.replaceVText($(this.el + " [v-text]"), 'v-text');

        // v-value 解析
        this.replaceVText($(this.el + " [v-value]"), 'v-value');

        // v-src 解析
        this.replaceVText($(this.el + " [v-src]"), 'v-src');

        // v-class 解析
        this.replaceVText($(this.el + " [v-class]"), 'v-class');

        // v-show 解析
        this.replaceVText($(this.el + " [v-show]"), 'v-show');

        // v-each 解析
        this.each(this.el + " [v-each]")

        // e-click 解析
        this.replaceEvent($(this.el + " [e-click]"), "e-click");

    }
    this.replaceEvent = function (els, key, obj) {
        var _this = this;
        $.each(els, function (i, item) {
            var text = $(item).attr(key);
            if(text){
                var method = text.substring(0,text.indexOf("("));
                var args =text.substring(text.indexOf("(")+1,text.indexOf(")")).split(",");
                $.each(args,function (x, arg) {
                    args[x] = _this.getElValue(arg,obj);
                });
                switch (key) {
                    case 'i-click':
                        $(item).click(function(){
                            _this[method].apply(_this, args);
                        });
                        break;
                    case 'e-click':
                        $(item).click(function(){
                            _this[method].apply(_this, args);
                        });
                        break;
                }
            }

        });
    }
    this.each = function(el, context) {
        var _this = this
        $(el).each(function (i, item) {
            var eachT = $(item).attr("v-each");
            var splitEachT = eachT.split(/ in | of /i);
            var itemName = $.trim(splitEachT[0]).split(",");
            var itemName1 = itemName[0];
            var itemName2 = "item";
            if (itemName.length > 1) {
                itemName2 = itemName[1];
            }
            var listName = $.trim(splitEachT[1]);

            var itemChildren = $(item).children();
            if (itemChildren.length >= 1) {
                //itemChildren = itemChildren[0];
                $(item).html("");
            //    $(item).append(itemChildren);
            }
            var listValues = _this.getElValue(listName, context);
            if (listValues === undefined) {
	      return	
	    }
	    $(item).removeAttr('v-each')
            if (listValues.length > 0) {
                $.each(listValues, function (i2, item2) {
                    var clone = $(itemChildren).clone(true);
                    var itexts = $(clone).find("[i-text]");
                    clone.show();
                    var obj = {};
                    obj[itemName1] = item2;
                    obj[itemName2] = {index: i2, num: i2 + 1, count: listValues.length};
                    _this.replaceVText(clone, 'i-text', obj);
                    _this.replaceVText(clone, 'i-value', obj);
                    _this.replaceVText(itexts, 'i-text', obj);
                    _this.replaceVText($(clone).find("[i-value]"), 'i-value', obj);
                    _this.replaceVText(clone, 'i-src', obj);
                    _this.replaceVText(clone, 'i-href', obj);
                    _this.replaceVText($(clone).find("[i-href]"), 'i-href', obj);
                    _this.replaceVText($(clone).find("[i-src]"), 'i-src', obj);
                    _this.replaceVText(clone, 'i-class', obj);
                    _this.replaceVText($(clone).find("[i-class]"), 'i-class', obj);
                    _this.replaceVText(clone, 'i-show', obj);
                    _this.replaceVText($(clone).find("[i-show]"), 'i-show', obj);
                    _this.replaceEvent(clone,'i-click',obj);
                    _this.replaceEvent(itexts,'i-click',obj);
		   _this.each($(clone).find("[v-each]"), obj)
		   
                    $(item).append(clone);
                });
            }

        });
    }
    this.replaceVText = function (els, key, obj) {
        var _this = this;
        $.each(els, function (i, item) {
            var text = $(item).attr(key);
            if(text){
                var hasEl = false;
                var result = "";
                var value = "";
                if (text.indexOf("{{") >= 0) {
                    hasEl = true;
                }else{
                    result=text;
                }
                while(hasEl){
                    var start = text.substring(0, text.indexOf("{{"));
                    var end = text.substring(text.indexOf("}}") + 2);
                    var vmodel = text.substring(text.indexOf("{{") + 2, text.indexOf("}}"));
                    value = _this.getElValue(vmodel, obj);
		   if (value === undefined) {
		      return	
		   }
                    result = start + (value == undefined ? "-" : value) + end;
                    if(end.indexOf("{{") >= 0){// 解析标签属性文本中的双括号
                        hasEl = true;
                        text = result;
                    }else{
                        hasEl = false;
                    }
                }
	        $(item).removeAttr(key)
                switch (key) {
                    case 'i-text':
                        $(item).text(result);
                        break;
                    case 'i-value':
                        $(item).attr('value',result);
                        break;
                    case 'i-src':
                        $(item).attr('src',result);
                        break;
                    case 'i-href':
                        $(item).attr('href',result);
                        break;
                    case 'i-class':
                        $(item).attr('class',result);
                        break;
                    case 'i-show':
                        if(result==true){
                            $(item).show();
                        }else{
                            $(item).hide();
                        }

                        break;
                    case 'v-text':
                        $(item).text(result);
                        break;
                    case 'v-value':
                        $(item).attr('value',result);
                        break;
                    case 'v-src':
                        $(item).attr('src',result);
                        break;
                    case 'v-class':
                        $(item).attr('class',result);
                        break;
                    case 'v-show':
                        if(result===true ||result==='true' ){
                            $(item).show();
                        }else{
                            $(item).hide();
                        }
                        break;
                }
            }

        });
    }
    this.getElValue= function (vmodel, value) {

        var vfun = "";
        if(vmodel.indexOf("(") >0){
            var v = vmodel.split("(");
            vmodel = v[1].substring(0,v[1].indexOf(")"));
            vfun =v[0];
            vfun = $.trim(vfun);
        }
        vmodel = $.trim(vmodel);

        var split = vmodel.split("\.");
        if (!value) {
            value = this;
        }

        for (var x = 0; x < split.length; x++) {
            if (value) {
                value = value[split[x]];
            }
        }
        if(split.length===1 && value===undefined){// 如果全局也没有此model值则等于它本身
            value = eval(vmodel)
        }

        // 判断是否存在函数运算
        if(value) {
            if (vfun && vfun !== "") {
                // 当前页面实例是否存在该函数
                if (this[vfun] && typeof this[vfun] === "function") {
                    value = this[vfun](value);
                } else {
                    // 全局函数
                    value =  window[vfun](value);
                }
            }
        }else{//无参函数
            if (vfun && vfun !== "") {
                // 当前页面实例是否存在该函数
                if (this[vfun] && typeof this[vfun] === "function") {
                    value = this[vfun]();
                } else {
                    // 全局函数
                    value =  window[vfun]();
                }
            }
        }

        return value;
    }

    this.create();

}
