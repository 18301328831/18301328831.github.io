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

        // 渲染if属性
        if (node.hasAttribute && node.hasAttribute('if')) {
            if (!this.calculate(node.getAttribute('if'), data)) {
                node.remove()
                return
            }
        }

        // 渲染文本节点
        if (node.nodeType === TEXT_NODE && this.hasEl(node.data)) {
            let text = node.data
            const [prefix, suffix, express] = this.getEl(text);
            node.data = prefix + this.calculate(express, data) + suffix
        }

        // 渲染节点属性
        if (node.getAttributeNames) {
            node.getAttributeNames().forEach(attrName => {
                let text = node.getAttribute(attrName)
                if (this.hasEl(text)) {
                    const [prefix, suffix, express] = this.getEl(text);
                    node.setAttribute(attrName, prefix + this.calculate(express, data) + suffix)
                }
            })
        }

        // 渲染show属性
        if (node.hasAttribute && node.hasAttribute('show')) {
            if (!this.calculate(node.getAttribute('show'), data)) {
                node.style.display = 'none'
            }
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

        // 递归渲染子节点
        [].slice.call(node.childNodes).forEach(child => {
            this.render(child, data)
        })
    }

    this.hasEl = function (str) {
        return /{{.*}}/.test(str)
    }

    this.hasFunc = function (str) {
        return /\(.*\)/.test(str)
    }

    this.getEl = function (str) {
        return [
            str.substring(0, str.indexOf("{{")),
            str.substring(str.indexOf("}}") + 2),
            str.substring(str.indexOf("{{") + 2, str.indexOf("}}")).trim()
        ]
    }

    this.getFunc = function (str) {
        return [
            str.substring(0, str.indexOf("(")).trim(),
            str.substring(str.indexOf("(") + 1, str.indexOf(")")).trim()
        ]
    }

    // 计算表达式
    this.calculate = function (express, data) {
        if (this.hasFunc(express)) {
            let [func, subExpress] = this.getFunc(express)
            let param = this.calculate(subExpress, data)
            return this[func] ? this[func](param) : window[func](param)
        }
        try {
            return eval("data." + express)
        } catch (e) {
            return eval(express)
        }
    }

    this.create()
}
