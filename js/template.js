let TPL = function (params) {

    this.create = function () {
        this.el = params.el
        for (let x in params.data) {
            this[x] = params.data[x]
        }
        for (let method in params.methods) {
            this[method] = params.methods[method]
        }
    }

    this.render = function (node, data) {
        const TEXT_NODE = 3

        // 设置默认数据
        node = node ? node : document.querySelector(this.el)
        data = data ? data : this

        // 渲染文本节点
        if (node.nodeType === TEXT_NODE && this.hasEl(node.data)) {
            let text = node.data
            const [prefix, suffix, express] = this.getEl(text);
            node.data = prefix + this.calculate(express.trim(), data) + suffix
        }

        // 渲染节点属性
        if (node.getAttributeNames) {
            node.getAttributeNames().forEach(attrName => {
                let text = node.getAttribute(attrName)
                if (this.hasEl(text)) {
                    const [prefix, suffix, express] = this.getEl(text);
                    node.setAttribute(attrName, prefix + this.calculate(express.trim(), data) + suffix)
                }
            })
        }

        // 渲染循环节点
        if (node.hasAttribute) {
            if (node.hasAttribute('for')) {
                let text = node.getAttribute('for')
                let items = text.split(/ in | of /i)

                let subNodeTemplates = []
                for (let i = 0; i<node.childNodes.length; i++) {
                    subNodeTemplates.push(node.childNodes[i].cloneNode(true))
                }
                node.innerHTML = ""

                this.calculate(items[1], data).forEach(subData => {
                    subNodeTemplates.forEach(template => {
                        data[items[0]] = subData
                        let clone = template.cloneNode(true)
                        this.render(clone, data)
                        node.append(clone)
                    })
                    //console.log(clone)
                })
                return
            }
        }

        // 递归渲染子节点
        [].slice.call(node.childNodes).forEach(child => {
            this.render(child, data)
        })
    }

    this.hasEl = function (str) {
        return /{{.*}}/.test(str)
    }

    this.getEl = function (str) {
        return [
            str.substring(0, str.indexOf("{{")),
            str.substring(str.indexOf("}}") + 2),
            str.substring(str.indexOf("{{") + 2, str.indexOf("}}"))
        ]
    }

    // 计算表达式
    this.calculate = function (express, data) {
        let func = ""
        if (express.indexOf("(") > 0) {
            let v = express.split("(")
            express = v[1].substring(0, v[1].indexOf(")"))
            func = v[0]
            func = func.trim()
        }
        express = express.trim()

        let split = express.split(/\./i)

        for (let x = 0; x < split.length; x++) {
            if (data) {
                data = data[split[x]]
            }
        }
        // 如果全局也没有此model值则等于它本身
        if (split.length === 1 && data === undefined) {
            data = eval(express)
        }

        // 判断是否存在函数运算
        if (data) {
            if (func && func !== "") {
                // 当前页面实例是否存在该函数
                if (this[func] && typeof this[func] === "function") {
                    data = this[func](data)
                } else {
                    // 全局函数
                    data = window[func](data)
                }
            }
        } else {//无参函数
            if (func && func !== "") {
                // 当前页面实例是否存在该函数
                if (this[func] && typeof this[func] === "function") {
                    data = this[func]()
                } else {
                    // 全局函数
                    data = window[func]()
                }
            }
        }
        return data
    }

    this.create()
}
