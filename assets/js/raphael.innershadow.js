(function() {
    if(Raphael.vml) {
        Raphael.el.innerShadow = function (size, offsetX, offsetY, color, opacity, filter_id, input) {
            // not supporting VML yet
            return this; // maintain chainability
        }
    } else {
        var $ = function(el, attr) {
            if(attr) {
                for(var key in attr)
                    if(attr.hasOwnProperty(key)) {
                        el.setAttribute(key, attr[key]);
                    }
            } else {
                return document.createElementNS("http://www.w3.org/2000/svg", el);
            }
        };
        Raphael.el.innerShadow = function(size, offsetX, offsetY, color, opacity, filter_id, input) {

            opacity = opacity || 1;
            filter_id = filter_id || "innershadow";
            input = input || "SourceGraphic";

            if(size != "none") {
                var fltr = $("filter"),
                    offset = $("feOffset"), // offset
                    blur = $("feGaussianBlur"), // shadow bluer
                    composite1 = $("feComposite"), // invert drop shadow to create inner shadow
                    flood = $("feFlood"), // color & opacity
                    composite2 = $("feComposite"), // clip color inside shadow
                    composite3 = $("feComposite") // put shadow over original object

                fltr.id = filter_id;

                $(fltr, {
                    "height" : "150%",
                    "width" : "150%"
                });

                $(offset, {
                    dx: offsetX,
                    dy: offsetY
                });

                $(blur, {
                    stdDeviation: +size,
                    result: "offset-blur"
                });

                $(composite1, {
                    operator: "out",
                    "in": "SourceGraphic",
                    in2: "offset-blur",
                    result: "inverse"
                });

                $(flood, {
                    "flood-color": color,
                    "flood-opacity": opacity,
                    result: "color"
                });

                $(composite2, {
                    operator: "in",
                    "in": "color",
                    in2: "inverse",
                    result: "shadow"
                });

                $(composite3, {
                    operator: "over",
                    "in": "shadow",
                    in2: input
                });

                fltr.appendChild(offset);
                fltr.appendChild(blur);
                fltr.appendChild(composite1);
                fltr.appendChild(flood);
                fltr.appendChild(composite2);
                fltr.appendChild(composite3);

                this.paper.defs.appendChild(fltr);
                this._blur = fltr;

                $(this.node, {
                    "filter" : "url(#" + filter_id + ")"
                });

            } else {
                if(this._blur) {
                    this._blur.parentNode.removeChild(this._blur);
                    delete this._blur;
                }
                this.node.removeAttribute("filter");
            }
            return this;  // maintain chainability
        };
    }

    Raphael.st.innerShadow = function(size, offsetX, offsetY, color, opacity, filter_id, input) {
        return this.forEach(function(el) {
            el.innerShadow(size, offsetX, offsetY, color, opacity, filter_id, input);
        });
    };
})();