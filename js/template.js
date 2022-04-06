let TPL = function (params) {

    let variables = {};
    let alias = {};
    let reg = /([a-zA-Z_][0-9a-zA-Z_]*)|(\.[a-zA-Z_][0-9a-zA-Z_]*)/g;

    let translateExpress = function (express, alias) {
        //console.debug("original ======= " + express)
        let result;
        for (let key in alias) {
            let i = 10;
            while ((result = reg.exec(express)) != null && i-- > 0) {
                if (result[0] === key) {
                    reg.lastIndex = 0;
                    express = express.substring(0, result.index) + alias[key] + express.substring(result.index + key.length, express.length);
                }
            }
        }
        //console.debug("finally  ======= " + express)
        return express;
    }

    alias.put = function (key, properties, index) {
        this[key] = translateExpress(properties, this);
        this[key] = index === undefined ? this[key] : this[key] + '[' + index + ']';
    }

    this.create = function () {
        this.el = params.el
        for (let x in params.data) {
            this[x] = params.data[x]
            alias.put(x, "this." + x)
        }
        for (let method in params.methods) {
            this[method] = params.methods[method]
            alias.put(method, "this." + method)
        }
    }

    this.render = function (node) {
        const TEXT_NODE = 3

        // 设置默认数据
        node = node ? node : document.querySelector(this.el)
        node.id = node.id === '' ? node.id = this.guid() : node.id;

        // 渲染if属性
        if (node.hasAttribute && node.hasAttribute('if')) {
            if (!this.calculate(node.getAttribute('if'))) {
                node.remove()
                return
            }
        }

        // 渲染文本节点
        if (node.nodeType === TEXT_NODE && this.hasEl(node.data)) {
            let text = node.data
            const [prefix, suffix, express] = this.getEl(text);
            node.data = prefix + this.calculate(express) + suffix
        }

        // 渲染节点属性
        if (node.getAttributeNames) {
            node.getAttributeNames().forEach(attrName => {
                let text = node.getAttribute(attrName)
                if (this.hasEl(text)) {
                    const [prefix, suffix, express] = this.getEl(text);
                    node.setAttribute(attrName, prefix + this.calculate(express) + suffix)
                    // // 正向渲染
                    // this.binding(node, express, function (node, variable) {
                    //     if (node.tagName === "INPUT" && attrName === "value") {
                    //         node.value = variable;
                    //     } else {
                    //         node.setAttribute(attrName, prefix + variable + suffix)
                    //     }
                    // });
                    // // 反向更新
                    // this.watch(node, attrName, function (value) {
                    //     variables[express] = value;
                    // })
                }
            })
        }

        // 渲染show属性
        if (node.hasAttribute && node.hasAttribute('show')) {
            let express = node.getAttribute('show');
            node.style.display = this.calculate(express) ? '' : 'none';
        }

        // 渲染循环节点
        if (node.hasAttribute && node.hasAttribute('for')) {
            let text = node.getAttribute('for')
            let items = text.split(/ in | of /i)

            let subNodeTemplates = []
            for (let i = 0; i < node.childNodes.length; i++) {
                subNodeTemplates.push(node.childNodes[i].cloneNode(true))
            }
            node.innerHTML = ""

            this.calculate(items[1]).forEach((subData, index) => {
                subNodeTemplates.forEach(template => {
                    alias.put(items[0], items[1], index)
                    let clone = template.cloneNode(true)
                    this.render(clone)
                    node.append(clone)
                })
                //console.log(clone)
            })
            return
        }

        // 递归渲染子节点
        [].slice.call(node.childNodes).forEach(child => {
            this.render(child)
        })
    }

    this.hasEl = function (str) {
        return /{{.*}}/.test(str)
    }

    this.getEl = function (str) {
        return [
            str.substring(0, str.indexOf("{{")),
            str.substring(str.indexOf("}}") + 2),
            str.substring(str.indexOf("{{") + 2, str.indexOf("}}")).trim()
        ]
    }

    // 计算表达式
    this.calculate = function (express) {
        try {
            return eval(translateExpress(express, alias))
        } catch (e) {
            console.error(e.message)
            return null
        }
    }

    this.guid = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    this.binding = function (node, variable, cb) {
        this.binding[variable] = node.id;
        Object.defineProperty(this, variable, {
            set: function (value) {
                variables[variable] = value;
                cb(node, variables[variable]);
            },
            get: function () {
                return variables[variable];
            }
        });
    }

    this.watch = function (targetNode, attribute, cb) {
        if ("value" === attribute) {
            targetNode.oninput = function (e) {
                cb(targetNode.value);
            }
            return
        }
        let observer = new MutationObserver(function (mutationsList) {
            mutationsList.forEach(function (item) {
                if (attribute === item.attributeName) {
                    cb(targetNode.getAttribute(attribute));
                }
            });
        });
        observer.observe(targetNode, {attributes: true});
    }

    this.create()
}
