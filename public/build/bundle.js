
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.20.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/App.svelte generated by Svelte v3.20.1 */

    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (75:2) {#each filterEmployee as theEmployee, i}
    function create_each_block(ctx) {
    	let option;
    	let t0_value = /*theEmployee*/ ctx[15].lastName + "";
    	let t0;
    	let t1;
    	let t2_value = /*theEmployee*/ ctx[15].firstName + "";
    	let t2;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = text(",");
    			t2 = text(t2_value);
    			option.__value = option_value_value = /*i*/ ctx[5];
    			option.value = option.__value;
    			attr_dev(option, "class", "svelte-1l3yey5");
    			add_location(option, file, 75, 4, 1652);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    			append_dev(option, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*filterEmployee*/ 8 && t0_value !== (t0_value = /*theEmployee*/ ctx[15].lastName + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*filterEmployee*/ 8 && t2_value !== (t2_value = /*theEmployee*/ ctx[15].firstName + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(75:2) {#each filterEmployee as theEmployee, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let input0;
    	let t0;
    	let select;
    	let select_size_value;
    	let t1;
    	let label0;
    	let input1;
    	let t2;
    	let label1;
    	let input2;
    	let t3;
    	let div;
    	let button0;
    	let t4;
    	let button0_disabled_value;
    	let t5;
    	let button1;
    	let t6;
    	let button1_disabled_value;
    	let t7;
    	let button2;
    	let t8;
    	let button2_disabled_value;
    	let dispose;
    	let each_value = /*filterEmployee*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			input0 = element("input");
    			t0 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			label0 = element("label");
    			input1 = element("input");
    			t2 = space();
    			label1 = element("label");
    			input2 = element("input");
    			t3 = space();
    			div = element("div");
    			button0 = element("button");
    			t4 = text("Create");
    			t5 = space();
    			button1 = element("button");
    			t6 = text("update");
    			t7 = space();
    			button2 = element("button");
    			t8 = text("delete");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "search employee");
    			attr_dev(input0, "class", "svelte-1l3yey5");
    			add_location(input0, file, 71, 0, 1476);
    			attr_dev(select, "name", "");
    			attr_dev(select, "id", "");
    			attr_dev(select, "size", select_size_value = 5);
    			attr_dev(select, "class", "svelte-1l3yey5");
    			if (/*i*/ ctx[5] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[12].call(select));
    			add_location(select, file, 73, 0, 1558);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "placeholder", "first name");
    			attr_dev(input1, "class", "svelte-1l3yey5");
    			add_location(input1, file, 80, 2, 1764);
    			attr_dev(label0, "for", "");
    			attr_dev(label0, "class", "svelte-1l3yey5");
    			add_location(label0, file, 79, 0, 1747);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "placeholder", "last name");
    			attr_dev(input2, "class", "svelte-1l3yey5");
    			add_location(input2, file, 83, 2, 1860);
    			attr_dev(label1, "for", "");
    			attr_dev(label1, "class", "svelte-1l3yey5");
    			add_location(label1, file, 82, 0, 1843);
    			button0.disabled = button0_disabled_value = !/*firstName*/ ctx[1] || !/*lastName*/ ctx[2];
    			attr_dev(button0, "class", "svelte-1l3yey5");
    			add_location(button0, file, 87, 2, 1962);
    			button1.disabled = button1_disabled_value = !/*firstName*/ ctx[1] || !/*lastName*/ ctx[2] || !/*selected*/ ctx[4];
    			attr_dev(button1, "class", "svelte-1l3yey5");
    			add_location(button1, file, 88, 2, 2041);
    			button2.disabled = button2_disabled_value = !/*selected*/ ctx[4];
    			attr_dev(button2, "class", "svelte-1l3yey5");
    			add_location(button2, file, 91, 2, 2141);
    			attr_dev(div, "class", "buttons svelte-1l3yey5");
    			add_location(div, file, 86, 0, 1938);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, input0, anchor);
    			set_input_value(input0, /*searchFirstName*/ ctx[0]);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, select, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*i*/ ctx[5]);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, label0, anchor);
    			append_dev(label0, input1);
    			set_input_value(input1, /*firstName*/ ctx[1]);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, label1, anchor);
    			append_dev(label1, input2);
    			set_input_value(input2, /*lastName*/ ctx[2]);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, t4);
    			append_dev(div, t5);
    			append_dev(div, button1);
    			append_dev(button1, t6);
    			append_dev(div, t7);
    			append_dev(div, button2);
    			append_dev(button2, t8);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[11]),
    				listen_dev(select, "change", /*select_change_handler*/ ctx[12]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[13]),
    				listen_dev(input2, "input", /*input2_input_handler*/ ctx[14]),
    				listen_dev(button0, "click", /*create*/ ctx[6], false, false, false),
    				listen_dev(button1, "click", /*update*/ ctx[7], false, false, false),
    				listen_dev(button2, "click", /*deleteEmployee*/ ctx[8], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*searchFirstName*/ 1 && input0.value !== /*searchFirstName*/ ctx[0]) {
    				set_input_value(input0, /*searchFirstName*/ ctx[0]);
    			}

    			if (dirty & /*filterEmployee*/ 8) {
    				each_value = /*filterEmployee*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*i*/ 32) {
    				select_option(select, /*i*/ ctx[5]);
    			}

    			if (dirty & /*firstName*/ 2 && input1.value !== /*firstName*/ ctx[1]) {
    				set_input_value(input1, /*firstName*/ ctx[1]);
    			}

    			if (dirty & /*lastName*/ 4 && input2.value !== /*lastName*/ ctx[2]) {
    				set_input_value(input2, /*lastName*/ ctx[2]);
    			}

    			if (dirty & /*firstName, lastName*/ 6 && button0_disabled_value !== (button0_disabled_value = !/*firstName*/ ctx[1] || !/*lastName*/ ctx[2])) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty & /*firstName, lastName, selected*/ 22 && button1_disabled_value !== (button1_disabled_value = !/*firstName*/ ctx[1] || !/*lastName*/ ctx[2] || !/*selected*/ ctx[4])) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}

    			if (dirty & /*selected*/ 16 && button2_disabled_value !== (button2_disabled_value = !/*selected*/ ctx[4])) {
    				prop_dev(button2, "disabled", button2_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(label0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(label1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let employee = [
    		{ firstName: "adam", lastName: "man" },
    		{ firstName: "bill", lastName: "gates" },
    		{
    			firstName: "mark",
    			lastName: "zuckerberg"
    		}
    	];

    	let searchFirstName = "";
    	let firstName = "";
    	let lastName = "";
    	let i = 0;

    	function create() {
    		$$invalidate(9, employee = employee.concat({ firstName, lastName }));
    		$$invalidate(5, i = employee.length - 1);
    		$$invalidate(1, firstName = $$invalidate(2, lastName = ""));
    	}

    	function update() {
    		$$invalidate(4, selected.firstName = firstName, selected);
    		$$invalidate(4, selected.lastName = lastName, selected);
    		$$invalidate(9, employee);
    	}

    	function deleteEmployee() {
    		const index = employee.indexOf(selected);
    		$$invalidate(9, employee = [...employee.slice(0, index), ...employee.slice(index + 1)]);
    		$$invalidate(1, firstName = $$invalidate(2, lastName = ""));
    		$$invalidate(5, i = Math.min(i, filterEmployee.length - 2));
    	}

    	function reset_inputs(theEmployee) {
    		$$invalidate(1, firstName = theEmployee ? theEmployee.firstName : "");
    		$$invalidate(2, lastName = theEmployee ? theEmployee.lastName : "");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function input0_input_handler() {
    		searchFirstName = this.value;
    		$$invalidate(0, searchFirstName);
    	}

    	function select_change_handler() {
    		i = select_value(this);
    		$$invalidate(5, i);
    	}

    	function input1_input_handler() {
    		firstName = this.value;
    		$$invalidate(1, firstName);
    	}

    	function input2_input_handler() {
    		lastName = this.value;
    		$$invalidate(2, lastName);
    	}

    	$$self.$capture_state = () => ({
    		employee,
    		searchFirstName,
    		firstName,
    		lastName,
    		i,
    		create,
    		update,
    		deleteEmployee,
    		reset_inputs,
    		filterEmployee,
    		selected
    	});

    	$$self.$inject_state = $$props => {
    		if ("employee" in $$props) $$invalidate(9, employee = $$props.employee);
    		if ("searchFirstName" in $$props) $$invalidate(0, searchFirstName = $$props.searchFirstName);
    		if ("firstName" in $$props) $$invalidate(1, firstName = $$props.firstName);
    		if ("lastName" in $$props) $$invalidate(2, lastName = $$props.lastName);
    		if ("i" in $$props) $$invalidate(5, i = $$props.i);
    		if ("filterEmployee" in $$props) $$invalidate(3, filterEmployee = $$props.filterEmployee);
    		if ("selected" in $$props) $$invalidate(4, selected = $$props.selected);
    	};

    	let filterEmployee;
    	let selected;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*searchFirstName, employee*/ 513) {
    			 $$invalidate(3, filterEmployee = searchFirstName
    			? employee.filter(theEmployee => {
    					const name = `${theEmployee.lastName},${theEmployee.firstName}`;
    					return name.toLowerCase().startsWith(searchFirstName.toLowerCase());
    				})
    			: employee);
    		}

    		if ($$self.$$.dirty & /*filterEmployee, i*/ 40) {
    			 $$invalidate(4, selected = filterEmployee[i]);
    		}

    		if ($$self.$$.dirty & /*selected*/ 16) {
    			 reset_inputs(selected);
    		}
    	};

    	return [
    		searchFirstName,
    		firstName,
    		lastName,
    		filterEmployee,
    		selected,
    		i,
    		create,
    		update,
    		deleteEmployee,
    		employee,
    		reset_inputs,
    		input0_input_handler,
    		select_change_handler,
    		input1_input_handler,
    		input2_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'adam'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
