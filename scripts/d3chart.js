class Chart {
  constructor() {
    // Defining state attributes
    const attrs = {
      id: "ID" + Math.floor(Math.random() * 1000000),
      svgWidth: 400,
      svgHeight: 200,
      marginTop: 5,
      marginBottom: 5,
      marginRight: 5,
      marginLeft: 5,
      container: "body",
      defaultTextFill: "#2C3E50",
      defaultFont: "Helvetica",
      data: null,
      chartWidth: null,
      chartHeight: null,
      firstRender: true,
      guiEnabled: false,
    };

    // Defining accessors
    this.getState = () => attrs;
    this.setState = (d) => Object.assign(attrs, d)

    // Automatically generate getter and setters for chart object based on the state properties;
    Object.keys(attrs).forEach((key) => {
      //@ts-ignore
      this[key] = function (_) {
        if (!arguments.length) {
          return attrs[key];
        }
        attrs[key] = _;
        return this;
      }
    });

    // Custom enter exit update pattern initialization (prototype method)
    this.initializeEnterExitUpdatePattern();
  }

  render() {
    this.addChartGui();
    this.setDynamicContainer()
    this.calculateProperties();
    this.drawSvgAndWrappers();
    this.drawRects();
    this.drawCircle();
    this.drawLine();
    this.setState({ firstRender: false })
    return this;
  }

  calculateProperties() {
    const {
      marginLeft,
      marginTop,
      marginRight,
      marginBottom,
      svgWidth,
      svgHeight
    } = this.getState();

    // Calculated properties
    let calc = {
      id: null,
      chartTopMargin: null,
      chartLeftMargin: null,
      chartWidth: null,
      chartHeight: null,
    };
    calc.id = "ID" + Math.floor(Math.random() * 1000000); // id for event handlings
    calc.chartLeftMargin = marginLeft;
    calc.chartTopMargin = marginTop;
    const chartWidth = svgWidth - marginRight - calc.chartLeftMargin;
    const chartHeight = svgHeight - marginBottom - calc.chartTopMargin;

    this.setState({ calc, chartWidth, chartHeight })
  }

  drawRects() {
    const { chart, data, chartWidth, chartHeight } = this.getState();

    console.log({ data: data })

    chart
      ._add({
        tag: "rect",
        selector: "rect-sample",
        className: "rect-class",
        data: data
      })
      .attr("width", chartWidth * 0.1)
      .attr("height", chartHeight * 0.1)
      .attr("fill", (d) => {
        return d.color
      })
      .attr("x", function (d, i) {
        return i * 50
      })
      .attr("y", function (d, i) {
        return i * 50
      })
  }

  drawCircle() {
    const { chart, data, chartHeight, chartWidth } = this.getState();

    const attrs = this.getState();

    const circleData = [{ x: chartWidth / 2, y: chartHeight / 2 }]

    chart
      ._add({
        tag: 'circle',
        className: 'circle',
        data: circleData,
      })
      .attr("cx", d => {
        return d.x
      })
      .attr("cy", d => {
        return d.y
      })
      .attr("r", '10')
      .attr('fill', 'orangered')
  }

  drawLine() {
    const { chart, data } = this.getState();

    const line = d3.line()
      .x(d => d.value)
      .y(d => d.value * 10)
      .curve(d3.curveMonotoneX);

    const lineData = data;

    chart
      ._add({
        tag: 'path',
        className: 'line',
        data: [lineData],
      })
      .attr('fill', 'none')
      .attr('stroke-width', '2')
      .attr('stroke', 'red')
      .attr('d', (d) => {
        return line(d);
      })
  }

  drawSvgAndWrappers() {
    const {
      d3Container,
      svgWidth,
      svgHeight,
      defaultFont,
      calc,
      data,
      chartWidth,
      chartHeight
    } = this.getState();

    // Draw SVG
    const svg = d3Container
      ._add({
        tag: "svg",
        className: "svg-chart-container"
      })
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .attr("font-family", defaultFont);

    // Add container g element
    let chart = svg
      ._add({
        tag: "g",
        className: "chart"
      })
      .attr(
        "transform",
        "translate(" + calc.chartLeftMargin + "," + calc.chartTopMargin + ")"
      );

    this.setState({ chart, svg })
  }

  initializeEnterExitUpdatePattern() {
    d3.selection.prototype._add = function (params) {
      let container = this;
      let className = params.className;
      let elementTag = params.tag;
      let data = params.data || [className];
      let exitTransition = params.exitTransition || null;
      let enterTransition = params.enterTransition || null;
      // Pattern in action
      let selection = container.selectAll("." + className).data(data, (d, i) => {
        if (typeof d === "object") {
          if (d.id) {
            return d.id
          }
        }
        return i;
      });
      if (exitTransition) {
        exitTransition(selection);
      } else {
        selection.exit().remove();
      }

      const enterSelection = selection.enter().append(elementTag);
      if (enterTransition) {
        enterTransition(enterSelection);
      }
      selection = enterSelection.merge(selection);
      selection.attr("class", className);
      return selection;
    };
  }

  setDynamicContainer() {
    const attrs = this.getState();

    // Drawing contaienrs
    let d3Container = d3.select(attrs.container);
    let containerRect = d3Container.node().getBoundingClientRect();
    if (containerRect.width > 0) attrs.svgWidth = containerRect.width;

    d3.select(window).on("resize." + attrs.id, () => {
      let containerRect = d3Container.node().getBoundingClientRect();
      if (containerRect.width > 0) attrs.svgWidth = containerRect.width;
      this.render();
    })

    this.setState({ d3Container })
  }

  addChartGui() {
    const { guiEnabled, firstRender } = this.getState()
    // console.log({ guiEnabled, firstRender })
    if (!guiEnabled || !firstRender) return;
    if (typeof lil == 'undefined') return;
    const gui = new lil.GUI()
    gui.close()
    const state = JSON.parse(JSON.stringify(this.getState()))
    const propChanged = () => {
      supportedKeys.forEach(k => {
        this.setState({ [k]: state[k] })
      })
      this.render();
    }
    const supportedKeys = Object.keys(state)
      .filter(k =>
        typeof state[k] == 'number' ||
        typeof state[k] == 'string' ||
        typeof state[k] == 'boolean'

      )
      .filter(d => !['guiEnabled', 'firstRender'].includes(d))
    // console.log({ supportedKeys, state })
    supportedKeys.forEach(key => {
      gui.add(state, key).onChange(d => {
        propChanged();
      })
    })
  }

}