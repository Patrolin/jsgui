/*type dual_vec3 = {
  x: number;
  dx: number;
  y: number;
  dy: number;
  z: number;
  dz: number;
}
*/function dual_vec3(x/*: number*/, y/*: number*/, z/*: number*/)/*: dual_vec3*/ {
  return {x, dx: 0, y, dy: 0, z, dz: 0};
}

function dual_vec3_add(A/*: dual_vec3*/, B/*: dual_vec3*/)/*: dual_vec3*/ {
  return {
    x: A.x + B.x,
    dx: A.dx + B.dx,
    y: A.y + B.y,
    dy: A.dy + B.dy,
    z: A.z + B.z,
    dz: A.dz + B.dz,
  };
}

function dual_vec3_sub(A/*: dual_vec3*/, B/*: dual_vec3*/)/*: dual_vec3*/ {
  return {
    x: A.x - B.x,
    dx: A.dx - B.dx,
    y: A.y - B.y,
    dy: A.dy - B.dy,
    z: A.z - B.z,
    dz: A.dz - B.dz,
  };
}

function dual_vec3_mulf(A/*: dual_vec3*/, f/*: number*/)/*: dual_vec3*/ {
  return {
    x: A.x * f,
    dx: A.dx * f,
    y: A.y * f,
    dy: A.dy * f,
    z: A.z * f,
    dz: A.dz * f,
  };
}

function dual_vec3_mul(A/*: dual_vec3*/, B/*: dual_vec3*/)/*: dual_vec3*/ {
  return {
    x: A.x * B.x,
    dx: A.dx * B.x + A.x * B.dx,
    y: A.y * B.y,
    dy: A.dy * B.y + A.y * B.dy,
    z: A.z * B.z,
    dz: A.dz * B.z + A.z * B.dz,
  };
}

function dual_vec3_div(A/*: dual_vec3*/, B/*: dual_vec3*/)/*: dual_vec3*/ {
  return {
    x: A.x / B.x,
    dx: (A.dx * B.x - A.x * B.dx) / (B.x * B.x),
    y: A.y / B.y,
    dy: (A.dy * B.y - A.y * B.dy) / (B.y * B.y),
    z: A.z / B.z,
    dz: (A.dz * B.z - A.z * B.dz) / (B.z * B.z),
  };
}
/*export type DateParts = {
  year?: number;
  month?: number;
  date?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  millis?: number;
}*/;
function reparseDate(date/*: Date*/, country/*: string*/ = "GMT")/*: Required<DateParts>*/ {
  const localeString = date.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    fractionalSecondDigits: 3,
    timeZone: country,
  });
  const [countryDate, countryMonth, countryYear, countryHours, countryMinutes, countrySeconds, countryMillis] = localeString.split(/\D+/);
  return {
    year: +countryYear,
    month: +countryMonth - 1,
    date: +countryDate,
    hours: +countryHours,
    minutes: +countryMinutes,
    seconds: +countrySeconds,
    millis: +countryMillis,
  };
}
class CountryDate {
  _countryUTCDate/*: Date*/;
  country/*: string*/;
  constructor(_countryUTCDate/*: Date*/, country/*: string*/ = "GMT") {
    this._countryUTCDate = _countryUTCDate;
    this.country = country;
  }
  get countryUTCString() {
    return this._countryUTCDate.toISOString();
  }
  /** https://en.wikipedia.org/wiki/List_of_tz_database_time_zones - e.g. "Europe/Prague" */
  static fromIsoString(isoString/*: string*/, country/*: string*/ = "GMT")/*: CountryDate*/ {
    const match = isoString.match(/^(\d+)-(\d+)-(\d+)(?:T(\d+):(\d+):(\d+)(?:\.(\d+))?)?(?:([\-+\d]+):(\d+))?/);
    if (match === null) throw new Error(`Invalid isoString: '${isoString}'`);
    const [_, year, month, day, hour, minute, second, milli, tzOffsetHours, tzOffsetMinutes] = match;
    const date = new Date(Date.UTC(+year, +month, +day, +(hour ?? 0), +(minute ?? 0), +(second ?? 0), +(milli ?? 0)));
    const tzOffset = +(tzOffsetHours ?? 0)*60 + +(tzOffsetMinutes ?? 0);
    date.setMinutes(date.getMinutes() - tzOffset);
    const parts = reparseDate(date, country);
    const countryYear = String(parts.year).padStart(4, "0");
    const countryMonth = String(parts.month).padStart(2, "0");
    const countryDate = String(parts.date).padStart(2, "0");
    const countryHours = String(parts.hours).padStart(2, "0");
    const countryMinutes = String(parts.minutes).padStart(2, "0");
    const countrySeconds = String(parts.seconds).padStart(2, "0");
    const countryMillis = String(parts.millis).padStart(3, "0");
    const _countryUTCDate = new Date(Date.UTC(+countryYear, +countryMonth-1, +countryDate, +countryHours, +countryMinutes, +countrySeconds, +countryMillis));
    return new CountryDate(_countryUTCDate, country);
  }
  add(offset/*: DateParts*/)/*: CountryDate*/ {
    const date = this._countryUTCDate;
    date.setUTCFullYear(date.getUTCFullYear() + (offset.year ?? 0));
    date.setUTCMonth(date.getUTCMonth() + (offset.month ?? 0));
    date.setUTCDate(date.getUTCDate() + (offset.date ?? 0));
    date.setUTCHours(date.getUTCHours() + (offset.hours ?? 0));
    date.setUTCMinutes(date.getUTCMinutes() + (offset.minutes ?? 0));
    date.setUTCSeconds(date.getUTCSeconds() + (offset.seconds ?? 0));
    date.setUTCMilliseconds(date.getUTCMilliseconds() + (offset.millis ?? 0));
    return new CountryDate(date, this.country);
  }
  with(parts/*: DateParts*/, country/*?: string*/)/*: CountryDate*/ {
    const date = new Date(this._countryUTCDate);
    if (parts.year) date.setUTCFullYear(parts.year);
    if (parts.month) date.setUTCMonth(parts.month);
    if (parts.date) date.setUTCDate(parts.date);
    if (parts.hours) date.setUTCHours(parts.hours);
    if (parts.minutes) date.setUTCMinutes(parts.minutes);
    if (parts.seconds) date.setUTCSeconds(parts.seconds);
    if (parts.millis) date.setUTCMilliseconds(parts.millis);
    return new CountryDate(date, country ?? this.country);
  }
  /** https://www.unicode.org/cldr/charts/45/supplemental/language_territory_information.html - e.g. "cs-CZ" */
  toLocaleString(format/*: string*/ = "cs", options/*: Omit<Intl.DateTimeFormatOptions, "timeZone">*/ = {})/*: string*/ {
    return this._countryUTCDate.toLocaleString(format, {...options, timeZone: "GMT"});
  }
  toIsoString()/*: string*/ {
    return ""; // TODO: search for iso string matching this date
  }
}
/*
setTimeout(() => {
  let a = CountryDate.fromIsoString("2022-03-01T00:00:00Z");
  console.log("ayaya.date", a);
  console.log('ayaya.dateString', a.toLocaleString());
  a = CountryDate.fromIsoString("2022-03-01T00:00:00+01:00", "Europe/Prague");
  console.log("ayaya.date", a);
  console.log('ayaya.dateString', a.toLocaleString());
})
*/
/*export type vec2 = {x: number; y: number}*/;
function vec2(x/*: number*/, y/*: number*/)/*: vec2*/ {
  return {x, y};
}
/*export type vec3 = {x: number; y: number, z: number}*/;
function vec3(x/*: number*/, y/*: number*/, z/*: number*/)/*: vec3*/ {
  return {x, y, z};
}

// basic operations
function vec2_add(A/*: vec2*/, B/*: vec2*/)/*: vec2*/ {
  return {x: A.x + B.x, y: A.y + B.y};
}
function vec3_add(A/*: vec3*/, B/*: vec3*/)/*: vec3*/ {
  return {x: A.x + B.x, y: A.y + B.y, z: A.z + B.z};
}

function vec2_sub(A/*: vec2*/, B/*: vec2*/)/*: vec2*/ {
  return {x: A.x - B.x, y: A.y - B.y};
}
function vec3_sub(A/*: vec3*/, B/*: vec3*/)/*: vec3*/ {
  return {x: A.x - B.x, y: A.y - B.y, z: A.z - B.z};
}

function vec2_mulf(A/*: vec2*/, b/*: number*/)/*: vec2*/ {
  return {x: A.x * b, y: A.y * b};
}
function vec3_mulf(A/*: vec3*/, b/*: number*/)/*: vec3*/ {
  return {x: A.x * b, y: A.y * b, z: A.z * b};
}

function vec2_mul(A/*: vec2*/, B/*: vec2*/)/*: vec2*/ {
  return {x: A.x * B.x, y: A.y * B.y};
}
function vec3_mul(A/*: vec3*/, B/*: vec3*/)/*: vec3*/ {
  return {x: A.x * B.x, y: A.y * B.y, z: A.z * B.z};
}

function vec2_div(A/*: vec2*/, B/*: vec2*/)/*: vec2*/ {
  return {x: A.x / B.x, y: A.y / B.y};
}
function vec3_div(A/*: vec3*/, B/*: vec3*/)/*: vec3*/ {
  return {x: A.x / B.x, y: A.y / B.y, z: A.z / B.z};
}

// fancy operations
function vec2_min_component(A/*: vec2*/)/*: number*/ {
  return Math.min(A.x, A.y);
}
function vec3_min_component(A/*: vec3*/)/*: number*/ {
  return Math.min(A.x, A.y, A.z);
}

function vec2_max_component(A/*: vec2*/)/*: number*/ {
  return Math.max(A.x, A.y);
}
function vec3_max_component(A/*: vec3*/)/*: number*/ {
  return Math.max(A.x, A.y, A.z);
}

function vec2_dot(A/*: vec2*/, B/*: vec2*/)/*: number*/ {
  return A.x*B.x + A.y*B.y;
}
function vec3_dot(A/*: vec3*/, B/*: vec3*/)/*: number*/ {
  return A.x*B.x + A.y*B.y + A.z*B.z;
}

function vec2_circle_norm(A/*: vec2*/)/*: number*/ {
  const {x, y} = A
  return Math.sqrt(x*x + y*y);
}
function vec3_circle_norm(A/*: vec3*/)/*: number*/ {
  const {x, y, z} = A
  return Math.sqrt(x*x + y*y + z*z);
}

function vec2_clamp_to_circle(A/*: vec2*/)/*: vec2*/ {
  const circle_norm = vec2_circle_norm(A);
  return circle_norm > 1 ? vec2_mulf(A, 1/circle_norm) : A;
}
function vec3_clamp_to_circle(A/*: vec3*/)/*: vec3*/ {
  const circle_norm = vec3_circle_norm(A);
  return circle_norm > 1 ? vec3_mulf(A, 1/circle_norm) : A;
}

function vec2_square_norm(A/*: vec2*/)/*: number*/ {
  const {x, y} = A
  return Math.max(Math.abs(x), Math.abs(y));
}
function vec3_square_norm(A/*: vec3*/)/*: number*/ {
  const {x, y, z} = A
  return Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
}

function vec2_clamp_to_square(A/*: vec2*/)/*: vec2*/ {
  const square_norm = vec2_square_norm(A);
  return square_norm > 1 ? vec2_mulf(A, 1/square_norm) : A;
}
function vec3_clamp_to_square(A/*: vec3*/)/*: vec3*/ {
  const square_norm = vec3_square_norm(A);
  return square_norm > 1 ? vec3_mulf(A, 1/square_norm) : A;
}
function is_nullsy(value/*: any*/)/*: value is null | undefined*/ {
  return value == null;
}
function is_array/*<V>*/(value/*: any*/)/*: value is V[]*/ {
  return Array.isArray(value);
}
function is_object/*<V>*/(value/*: any*/)/*: value is Record<string, V>*/ {
  return value !== null && typeof value === "object";
}
function is_string(value/*: any*/)/*: value is string*/ {
  return typeof value === "string";
}
function is_number(value/*: any*/)/*: value is number*/ {
  return typeof value === "number";
}
function is_boolean(value/*: any*/)/*: value is boolean*/ {
  return typeof value === "boolean";
}
function is_function(value/*: any*/)/*: value is Function*/ {
  return typeof value === "function";
}
function is_symbol(value/*: any*/)/*: value is Symbol*/ {
  return typeof value === "symbol";
}
function is_bigint(value/*: any*/)/*: value is BigInt*/ {
  return typeof value === "bigint";
}
/** clamp value between min and max (defaulting to min) */
function clamp(value/*: number*/, min/*: number*/, max/*: number*/)/*: number*/ {
  return Math.max(min, Math.min(value, max));
}
function lerp(t/*: number*/, x/*: number*/, y/*: number*/)/*: number*/ {
  return (1-t)*x + t*y;
}
function unlerp(value/*: number*/, x/*: number*/, y/*: number*/)/*: number*/ {
  return (x - value) / (x - y);
}

// modulo
/** return `a` remainder `b` */
function rem(a/*: number*/, b/*: number*/)/*: number*/ {
  return a % b;
}
/** return `a` modulo `b` */
function mod(a/*: number*/, b/*: number*/)/*: number*/ {
  return ((a % b) + b) % b;
}

// noise
const PHI_1_INV = 0.6180339887498948;
/** map `seed` to noise, such that `noise(0) == 0`  */
function noise(seed/*: number*/)/*: number*/ {
  return mod(seed * PHI_1_INV, 1);
}

// directed rounding
function round_directed_towards_infinity(value/*: number*/) {
  return Math.ceil(value);
}
function round_directed_towards_negative_infinity(value/*: number*/) {
  return Math.floor(value);
}
function round_directed_towards_zero(value/*: number*/) {
  return Math.trunc(value);
}
function round_directed_away_from_zero(value/*: number*/) {
  return value > 0 ? Math.ceil(value) : Math.floor(value);
}

// nearest rounding
function round_towards_infinity(value/*: number*/) {
  return Math.floor(value + 0.5);
}
function round_towards_negative_infinity(value/*: number*/) {
  return Math.ceil(value - 0.5);
}
function round_towards_zero(value/*: number*/) {
  return value > 0 ? Math.ceil(value - 0.5) : Math.floor(value + 0.5);
}
function round_away_from_zero(value/*: number*/) {
  return value > 0 ? Math.floor(value + 0.5) : Math.ceil(value - 0.5);
}
function round_to_even(value/*: number*/) {
  let result = round_towards_infinity(value);
  const is_tie = (Math.abs(value) % 1 === 0.5);
  const result_is_odd = (result % 2 !== 0);
  if (is_tie && result_is_odd) result -= 1;
  return result;
}
function round_to_odd(value/*: number*/) {
  let result = round_towards_infinity(value);
  const is_tie = (Math.abs(value) % 1 === 0.5);
  const result_is_even = (result % 2 === 0);
  if (is_tie && result_is_even) result -= 1;
  return result;
}
function makeArray/*<T>*/(N/*: number*/, map/*: (v: undefined, i: number) => T*/)/*: T[]*/ {
	const arr = Array(N);
	for (let i = 0; i < arr.length; i++) {
		arr[i] = map(undefined, i);
	}
	return arr;
}
function asArray/*<T>*/(valueOrArrayOrNullsy/*: T | T[] | undefined | null*/)/*: T[]*/ {
	if (is_array(valueOrArrayOrNullsy)) return valueOrArrayOrNullsy;
	return valueOrArrayOrNullsy == null ? [] : [valueOrArrayOrNullsy];
}

// group
/*type Group<T> = {
	groupId: string;
	items: T[];
}
*/function groupBy/*<T>*/(items/*: T[]*/, key/*: (v: T) => string*/)/*: Group<T>[]*/ {
	const groups = {} /*as Record<string, T[]>*/;
	for (let item of items) {
		const item_key = key(item);
		const groupItems = groups[item_key /*as string*/] ?? [];
		groupItems.push(item);
		groups[item_key /*as string*/] = groupItems;
	}
	return Object.entries(groups).map(([groupId, groupItems]) => ({groupId: groupId, items: groupItems}));
}

// sort
/*type Comparable = number | string | Date | BigInt | undefined | null*/;
function compare(a/*: any*/, b/*: any*/)/*: number*/ {
	return ((a > b) /*as unknown*/ /*as number*/) - ((a < b) /*as unknown*/ /*as number*/);
}
function sortBy/*<T, K extends Comparable>*/(arr/*: T[]*/, key/*: (v: T) => K*/, descending = false)/*: T[]*/ {
	return arr.sort((a, b) => {
		let comparison = compare(key(a), key(b));
		if (descending) {comparison = -comparison;}
		return comparison;
	});
}
function sortByArray/*<T, K extends Comparable>*/(arr/*: T[]*/, key/*: (v: T) => K[]*/, descending/*: boolean[]*/ = [])/*: T[]*/ {
	return arr.sort((a, b) => {
		const a_key = key(a);
		const b_key = key(b);
		const n = Math.max(a_key.length, b_key.length);
		for (let i = 0; i < n; i++) {
			let comparison = compare(a_key[i], b_key[i]);
			if (descending[i]) {comparison = -comparison;}
			if (comparison !== 0) return comparison;
		}
		return 0;
	});
}
/*export type DialogProps = BaseProps & ({
  open: boolean;
  onClose?: () => void;
  closeOnClickBackdrop?: boolean;
})*/;
export const dialog = makeComponent(function dialog(props/*: DialogProps*/)/*: RenderReturn*/ {
  const {open, onClose, closeOnClickBackdrop} = props;
  const [state] = this.useState({prevOpen: false});
  const element = this.useNode(() => document.createElement("dialog"));
  element.onclick = (event) => {
    if (closeOnClickBackdrop && (event.target === element) && onClose) onClose();
  }
  return {
    onMount: () => {
      if (open !== state.prevOpen) {
        if (open) {
          element.showModal();
        } else {
          element.close();
        }
        state.prevOpen = open;
      }
    },
  };
});

// popup
/*export type PopupDirection = "up" | "right" | "down" | "left" | "mouse"*/;
function _getPopupLeftTop(direction/*: PopupDirection*/, props/*: {
  mouse: {x: number, y: number},
  wrapperRect: DOMRect,
  popupRect: DOMRect,
}*/) {
  const {mouse, popupRect, wrapperRect} = props;
  switch (direction) {
    case "up":
      return [
        wrapperRect.left + 0.5 * (wrapperRect.width - popupRect.width),
        wrapperRect.top - popupRect.height
      ];
    case "right":
      return [
        wrapperRect.left + wrapperRect.width,
        wrapperRect.top + 0.5 * (wrapperRect.height - popupRect.height)
      ];
    case "down":
      return [
        wrapperRect.left + 0.5 * (wrapperRect.width - popupRect.width),
        wrapperRect.top + wrapperRect.height
      ]
    case "left":
      return [
        wrapperRect.left - popupRect.width,
        wrapperRect.top + 0.5 * (wrapperRect.height - popupRect.height)
      ];
    case "mouse":
      return [
        mouse.x,
        mouse.y - popupRect.height
      ];
  }
}
function _getPopupLeftTopWithFlipAndClamp(props/*: {
  direction: PopupDirection,
  mouse: {x: number, y: number},
  windowRight: number;
  windowBottom: number;
  wrapperRect: DOMRect,
  popupRect: DOMRect,
}*/) {
  let {direction, windowBottom, windowRight, popupRect} = props;
  // flip
  let [left, top] = _getPopupLeftTop(direction, props);
  switch (direction) {
    case "up":
      if (top < 0) {
        direction = "down";
        [left, top] = _getPopupLeftTop(direction, props);
      }
      break;
    case "down": {
      const bottom = top + popupRect.height;
      if (bottom >= windowBottom) {
        direction = "up";
        [left, top] = _getPopupLeftTop(direction, props);
      }
      break;
    }
    case "left":
      if (left < 0) {
        direction = "right";
        [left, top] = _getPopupLeftTop(direction, props);
      }
      break;
    case "right": {
      const right = left + popupRect.width;
      if (right >= windowRight) {
        direction = "left";
        [left, top] = _getPopupLeftTop(direction, props);
      }
      break;
    }
  }
  // clamp
  const maxLeft = windowRight - popupRect.width - SCROLLBAR_WIDTH;
  left = clamp(left, 0, maxLeft);
  const maxTop = windowBottom - popupRect.height - SCROLLBAR_WIDTH;
  top = clamp(top, 0, maxTop);
  return [left, top] /*as [number, number]*/;
}
/*export type PopupWrapperProps = {
  content: Component;
  direction?: PopupDirection;
  // TODO: arrow?: boolean;
  /** NOTE: open on hover if undefined *//*
  open?: boolean;
  interactable?: boolean;
}*/;
export const popupWrapper = makeComponent(function popupWrapper(props/*: PopupWrapperProps*/)/*: RenderReturn*/ {
  const {content, direction: _direction = "up", open, interactable = false} = props;
  const [state] = this.useState({mouse: {x: -1, y: -1}, open: false, prevOnScroll: null /*as EventListener | null*/});
  const wrapper = this.useNode(() => document.createElement("div"));
  const {windowBottom, windowRight} = this.useWindowResize(); // TODO: just add a window listener?
  const movePopup = () => {
    if (!state.open) return;
    const popupNode = popup._.prevNode /*as HTMLDivElement*/;
    const popupContentWrapperNode = popupContentWrapper._.prevNode /*as HTMLDivElement*/;
    const wrapperRect = wrapper.getBoundingClientRect();
    popupNode.style.left = "0px"; // NOTE: we move popup to top left to allow it to grow
    popupNode.style.top = "0px";
    const popupRect = popupContentWrapperNode.getBoundingClientRect();
    const [left, top] = _getPopupLeftTopWithFlipAndClamp({
      direction: _direction,
      mouse: state.mouse,
      popupRect,
      windowBottom,
      windowRight,
      wrapperRect
    });
    popupNode.style.left = addPx(left);
    popupNode.style.top = addPx(top);
  }
  const openPopup = () => {
    state.open = true;
    (popup._.prevNode /*as HTMLDivElement | null*/)?.showPopover();
    movePopup();
  }
  const closePopup = () => {
    state.open = false;
    (popup._.prevNode /*as HTMLDivElement | null*/)?.hidePopover();
  };
  if (open == null) {
    wrapper.onmouseenter = openPopup;
    wrapper.onmouseleave = closePopup;
  }
  if (_direction === "mouse") {
    wrapper.onmousemove = (event) => {
      state.mouse = {x: event.clientX, y: event.clientY};
      movePopup();
    }
  }
  const popup = this.append(div({
    className: "popup",
    attribute: {popover: "manual", dataInteractable: interactable},
  }));
  const popupContentWrapper = popup.append(div({className: "popup-content-wrapper"}));
  popupContentWrapper.append(content);
  return {
    onMount: () => {
      for (let acc = (this._.prevNode /*as ParentNode | null*/); acc != null; acc = acc.parentNode) {
        acc.removeEventListener("scroll", state.prevOnScroll);
        acc.addEventListener("scroll", movePopup, {passive: true});
      }
      state.prevOnScroll = movePopup;
      if (open == null) return;
      if (open != state.open) {
        if (open) {
          openPopup();
        } else {
          closePopup();
        }
      }
    },
    onUnmount: (removed/*: boolean*/) => {
      if (!removed) return;
      for (let acc = (this._.prevNode /*as ParentNode | null*/); acc != null; acc = acc.parentNode) {
        acc.removeEventListener("scroll", state.prevOnScroll);
      }
    },
  };
});
export const JSGUI_VERSION = "v0.19-dev";
function parseJsonOrNull(jsonString/*: string*/)/*: JSONValue*/ {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}
/*export type Nullsy = undefined | null*/;
/*export type StringMap<T = any> = Record<string, T>*/;
/*export type JSONValue = string | number | any[] | StringMap | null*/;
/*export type ParentNodeType = HTMLElement | SVGSVGElement*/;
/*export type NodeType = ParentNodeType | Text*/;
/*export type EventWithTarget<T = Event, E = HTMLInputElement> = T & {target: E}*/;
/*export type InputEventWithTarget = EventWithTarget<InputEvent>*/;
/*export type ChangeEventWithTarget = EventWithTarget<Event>*/;
/*export type _EventListener<T = Event> = ((event: T) => void)*/;
/*export type EventsMap = {
  // NOTE: Safari iOS and Chrome android don't support onclick - use onpointerup instead
  // NOTE: mouseXX and touchXX events are platform-specific, so they shouldn't be used
  touchstart?: _EventListener<TouchEvent> | null; // NOTE: if you want to prevent drag to scroll on mobile, you need to call .preventDefault() on this event specifically..

  pointerenter?: _EventListener<PointerEvent> | null; // same as pointerover?
  pointerleave?: _EventListener<PointerEvent> | null; // same as pointerout?
  pointerdown?: _EventListener<PointerEvent> | null;
  pointermove?: _EventListener<PointerEvent> | null;
  pointercancel?: _EventListener<PointerEvent> | null;
  pointerup?: _EventListener<PointerEvent> | null;

  focus?: _EventListener<FocusEvent> | null;
  blur?: _EventListener<FocusEvent> | null;
  focusin?: _EventListener<FocusEvent> | null;
  focusout?: _EventListener<FocusEvent> | null;

  keydown?: _EventListener<KeyboardEvent> | null;
  keypress?: _EventListener<KeyboardEvent> | null;
  keyup?: _EventListener<KeyboardEvent> | null;

  scroll?: _EventListener<WheelEvent> | null;

  beforeinput?: _EventListener<InputEventWithTarget> | null;
  input?: _EventListener<InputEventWithTarget> | null;

  compositionstart?: _EventListener<CompositionEvent> | null;
  compositionend?: _EventListener<CompositionEvent> | null;
  compositionupdate?: _EventListener<CompositionEvent> | null;

  paste?: _EventListener<ClipboardEvent> | null;
}*/;
/*export type UndoPartial<T> = T extends Partial<infer R> ? R : T*/;
/*export type Diff<T> = {
  key: string;
  oldValue: T;
  newValue: T;
}*/;
function getDiff/*<T>*/(oldValue/*: StringMap<T>*/, newValue/*: StringMap<T>*/)/*: Diff<T>[]*/ {
  const diffMap/*: StringMap<Partial<Diff<T>>>*/ = {};
  for (let [k, v] of Object.entries(oldValue)) {
    let d = diffMap[k] ?? {key: k};
    d.oldValue = v;
    diffMap[k] = d;
  }
  for (let [k, v] of Object.entries(newValue)) {
    let d = diffMap[k] ?? {key: k};
    d.newValue = v;
    diffMap[k] = d;
  }
  return (Object.values(diffMap) /*as Diff<T>[]*/).filter(v => v.newValue !== v.oldValue);
}
function getDiffArray(oldValues/*: string[]*/, newValues/*: string[]*/)/*: Diff<string>[]*/ {
  const diffMap/*: StringMap<Partial<Diff<string>>>*/ = {};
  for (let k of oldValues) {
    let d = diffMap[k] ?? {key: k};
    d.oldValue = k;
    diffMap[k] = d;
  }
  for (let k of newValues) {
    let d = diffMap[k] ?? {key: k};
    d.newValue = k;
    diffMap[k] = d;
  }
  return (Object.values(diffMap) /*as Diff<string>[]*/).filter(v => v.newValue !== v.oldValue);
}

// NOTE: tsc is stupid and removes comments before types
/*export type ComponentFunction<T extends any[]> = (...argsOrProps: T) => Component*/;
/*export type ComponentOptions = {
  name?: string;
}*/;
/*export type BaseProps = {
  key?: string | number;
  attribute?: StringMap<string | number | boolean>;
  cssVars?: StringMap<string | number | undefined>;
  className?: string | string[];
  style?: StringMap<string | number | undefined>;
  events?: EventsMap;
}*/;
/*export type RenderedBaseProps = UndoPartial<Omit<BaseProps, "key" | "className">> & {key?: string, className: string[]}*/;
/*export type RenderReturn = void | {
  onMount?: () => void,
  onUnmount?: (removed: boolean) => void,
}*/;
/*export type RenderFunction<T extends any[]> = (this: Component, ...argsOrProps: T) => RenderReturn*/;
/*export type SetState<T, IsPartial = true> = (newValue: IsPartial extends true ? Partial<T> : T) => T*/;
/*export type UseNodeState = {nodeDependOn?: any}*/;
/*export type GetErrorsFunction<K extends string> = (errors: Partial<Record<K, string>>) => void*/;
/*export type UseWindowResize = { windowBottom: number, windowRight: number }*/;
// component
function _setDefaultChildKey(component/*: Component*/, child/*: Component*/) {
  const name = child.name;
  let key = child.baseProps.key;
  if (key == null) {
    if (name === "text") {
      key = `auto_${component.indexedTextCount++}_text`;
    } else {
      key = `auto_${component.indexedChildCount++}_${name}`;
    }
  }
  child.key = key;
}
function DEFAULT_STATE_UPDATER/*<T extends object>*/(diff/*: Partial<T>*/, prevState/*: T | undefined*/) {
  return {...prevState, ...diff} /*as T*/;
}
class Component {
  // props
  name/*: string*/;
  args/*: any[]*/;
  baseProps/*: RenderedBaseProps*/;
  props/*: StringMap*/;
  children/*: Component[]*/;
  onRender/*: RenderFunction<any[]>*/;
  options/*: ComponentOptions*/;
  // metadata
  _/*: ComponentMetadata | RootComponentMetadata*/;
  key/*: string*/;
  // hooks
  node/*: NodeType | null*/;
  indexedChildCount/*: number*/;
  indexedTextCount/*: number*/;
  constructor(onRender/*: RenderFunction<any[]>*/, args/*: any[]*/, baseProps/*: RenderedBaseProps*/, props/*: StringMap*/, options/*: ComponentOptions*/) {
    this.name = options.name ?? onRender.name;
    if (!this.name && (options.name !== "")) throw `Function name cannot be empty: ${onRender}`;
    this.args = args
    this.baseProps = baseProps;
    this.props = props;
    this.children = [];
    this.onRender = onRender;
    this.options = options;
    // metadata
    this._ = null /*as any*/;
    this.key = "";
    // hooks
    this.node = null;
    this.indexedChildCount = 0;
    this.indexedTextCount = 0;
  }
  useNode/*<T extends NodeType>*/(getNode/*: () => T*/, nodeDependOn/*?: any*/)/*: T*/ {
    const [state] = this.useState/*<UseNodeState>*/({});
    let node = this.getNode();
    if (state.nodeDependOn !== nodeDependOn) {
      node = getNode();
      state.nodeDependOn = nodeDependOn;
    } else if (node == null) {
      node = getNode();
    }
    return (this.node = node) /*as T*/;
  }
  getNode()/*: NodeType | null*/ {
    return this._.prevNode;
  }
  append(childOrString/*: string | Component*/)/*: Component*/ {
    const child = (childOrString instanceof Component) ? childOrString : text(childOrString);
    this.children.push(child);
    return child;
  }
  /** `return [value, setStateAndRerender, setValue]` */
  useState/*<T extends object>*/(defaultStateOrUpdater/*: T | ((diff: Partial<T>, prevState: T | undefined) => T)*/)/*: [T, SetState<T>, SetState<T>]*/ {
    const {_} = this;
    const userInputIsUpdater = typeof defaultStateOrUpdater === "function";
    const updater = userInputIsUpdater ? defaultStateOrUpdater : DEFAULT_STATE_UPDATER;
    if (_.state === undefined) {
      const defaultState = userInputIsUpdater ? {} : defaultStateOrUpdater;
      _.state = updater(defaultState, undefined);
    }
    const setState = (newValue/*: Partial<T>*/) => {
      const newState = updater(newValue, _.state /*as T*/);
      _.state = newState;
      return newState;
    };
    const setStateAndRerender = (newValue/*: Partial<T>*/) => {
      const newState = setState(newValue);
      this.rerender();
      return newState;
    }
    return [_.state /*as T*/, setStateAndRerender, setState];
  }
  useValidate/*<K extends string>*/(getErrors/*: GetErrorsFunction<K>*/) {
    return () => {
      let errors/*: Partial<Record<K, string>>*/ = {};
      getErrors(errors);
      const state = this._.state /*as StringMap*/;
      state.errors = errors;
      state.didValidate = true;
      const hasErrors = Object.keys(errors).length > 0;
      if (hasErrors) {
        this.rerender();
      }
      return !hasErrors;
    }
  }
  // dispatch
  useMedia(mediaQuery/*: StringMap<string | number>*/) { // TODO: add types
    const key = Object.entries(mediaQuery).map(([k, v]) => `(${camelCaseToKebabCase(k)}: ${addPx(v)})`).join(' and ');
    const dispatchTarget = _dispatchTargets.media.addDispatchTarget(key);
    dispatchTarget.addComponent(this);
    return dispatchTarget.state.matches; // TODO: this forces recalculate style (4.69 ms), cache value so this doesn't happen?
  }
  /** `return [value, setValueAndDispatch, setValue]` */
  useLocalStorage/*<T>*/(key/*: string*/, defaultValue/*: T*/)/*: [T, SetState<T, false>, SetState<T, false>]*/ {
    _dispatchTargets.localStorage.addComponent(this);
    const value = (parseJsonOrNull(localStorage[key]) /*as [T] | null*/)?.[0] ?? defaultValue;
    const setValue = (newValue/*: T*/) => {
      localStorage.setItem(key, JSON.stringify([newValue]));
      return newValue;
    }
    const setValueAndDispatch = (newValue/*: T*/) => {
      const prevValue = localStorage[key];
      setValue(newValue);
      if (JSON.stringify([newValue]) !== prevValue) {
        _dispatchTargets.localStorage.dispatch();
        this.rerender();
      }
      return newValue;
    }
    return [value, setValueAndDispatch, setValue];
  }
  useLocation()/*: PathParts*/ {
    _dispatchTargets.location.addComponent(this);
    return {}; // TODO: useLocation()
  }
  useLocationHash()/*: string*/ {
    _dispatchTargets.locationHash.addComponent(this);
    return window.location.hash;
  }
  useWindowResize()/*: UseWindowResize*/ {
    _dispatchTargets.windowResize.addComponent(this);
    return { windowBottom: window.innerHeight, windowRight: window.innerWidth };
  }
  rerender() {
    const root_ = this._.root;
    const rootComponent = root_.component;
    const newGcFlag = !root_.gcFlag;
    if (!root_.willRerenderNextFrame) {
      root_.willRerenderNextFrame = true;
      requestAnimationFrame(() => {
        const newRootComponent = _copyComponent(rootComponent);
        newRootComponent._ = root_;
        root_.gcFlag = newGcFlag;
        root_.component = newRootComponent;
        _render(newRootComponent, root_.parentNode);
        _unloadUnusedComponents(rootComponent, newGcFlag);
        root_.willRerenderNextFrame = false;
      });
    }
  }
  _findByName(name/*: string*/)/*: Component | undefined*/ {
    if (this.name === name) return this;
    return this.children.map(v => v._findByName(name)).filter(v => v)[0];
  }
  _logByName(name/*: string*/) {
    const component = this._findByName(name);
    console.log({ ...component, _: { ...component?._ } });
  }
}
function makeComponent/*<A extends Parameters<any>>*/(onRender/*: RenderFunction<A>*/, options/*: ComponentOptions*/ = {})/*: ComponentFunction<A>*/ {
  return (...argsOrProps/*: any[]*/) => {
    const argCount = (onRender+"").split("{")[0].split(",").length; // NOTE: allow multiple default arguments
    const args = new Array(argCount).fill(undefined);
    for (let i = 0; i < argsOrProps.length; i++) {
      args[i] = argsOrProps[i];
    }
    const propsAndBaseProps = (argsOrProps[argCount - 1] ?? {}) /*as BaseProps & StringMap*/;
    const {key, style = {}, attribute = {}, className: className, cssVars = {}, events = {} /*as EventsMap*/, ...props} = propsAndBaseProps;
    if (('key' in propsAndBaseProps) && ((key == null) || (key === ""))) {
      const name = options.name ?? onRender.name;
      console.warn(`${name} component was passed ${stringifyJs(key)}, did you mean to pass a string?`)
    }
    const baseProps/*: RenderedBaseProps*/ = {
      key: (key != null) ? String(key) : undefined,
      style,
      attribute,
      className: Array.isArray(className) ? className : (className ?? "").split(" ").filter(v => v),
      cssVars,
      events,
    };
    return new Component(onRender, args, baseProps, props, options);
  }
}
export const text = makeComponent(function text(str/*: string*/, _props/*: {}*/ = {}) {
  const [state] = this.useState({prevStr: ""});
  const textNode = this.useNode(() => new Text(""));
  if (str !== state.prevStr) {
    state.prevStr = str;
    textNode.textContent = str;
  }
});
function _copyComponent(component/*: Component*/) {
  const newComponent = new Component(component.onRender, component.args, component.baseProps, component.props, component.options);
  newComponent._ = component._;
  return newComponent;
}

// TODO: remove this whole mess, and just always rerender the whole tree
/*export type DispatchTargetAddListeners = (dispatch: () => void) => any*/;
// dispatch
class DispatchTarget {
  components/*: Component[]*/;
  state/*: any*/;
  constructor(addListeners/*: DispatchTargetAddListeners*/ = () => {}) {
    this.components = [];
    this.state = addListeners(() => this.dispatch());
  }
  addComponent(component/*: Component*/) {
    this.components.push(component);
  }
  removeComponent(component/*: Component*/) {
    const i = this.components.indexOf(component);
    if (i !== -1) this.components.splice(i, 1);
  }
  dispatch() {
    for (let component of this.components) {
      component.rerender();
    }
  }
}
class DispatchTargetMap {
  data/*: StringMap<DispatchTarget>*/;
  addListeners/*: (key: string) => DispatchTargetAddListeners*/;
  constructor(addListeners/*: (key: string) => DispatchTargetAddListeners*/) {
    this.data = {};
    this.addListeners = addListeners;
  }
  addDispatchTarget(key/*: string*/) {
    const {data, addListeners} = this;
    const oldDT = data[key];
    if (oldDT != null) return oldDT;
    const newDT = new DispatchTarget(addListeners(key));
    data[key] = newDT;
    return newDT;
  }
  removeComponent(component/*: Component*/) {
    for (let key in this.data) {
      this.data[key].removeComponent(component);
    }
  }
}
/*export type AddDispatchTarget = {
  map: StringMap<DispatchTarget>;
  key: string;
  addListeners: DispatchTargetAddListeners;
}*/;
export const _dispatchTargets = {
  media: new DispatchTargetMap((key) => (dispatch) => {
    const mediaQueryList = window.matchMedia(key);
    mediaQueryList.addEventListener("change", dispatch);
    return mediaQueryList;
  }),
  localStorage: new DispatchTarget((dispatch) => window.addEventListener("storage", dispatch)),
  location: new DispatchTarget((_dispatch) => {}),
  locationHash: new DispatchTarget((dispatch) => {
    window.addEventListener("hashchange", () => {
      _scrollToLocationHash();
      dispatch();
    });
  }),
  windowResize: new DispatchTarget((dispatch) => window.addEventListener("resize", dispatch)),
  /*mouseMove: new DispatchTarget((dispatch) => {
    const state = {x: -1, y: -1};
    window.addEventListener("mousemove", (event) => {
      state.x = event.clientX;
      state.y = event.clientY;
      dispatch();
    });
    return state;
  }),*/
  removeComponent(component/*: Component*/) {
    _dispatchTargets.media.removeComponent(component);
    _dispatchTargets.localStorage.removeComponent(component);
    _dispatchTargets.location.removeComponent(component);
    _dispatchTargets.locationHash.removeComponent(component);
    _dispatchTargets.windowResize.removeComponent(component);
  },
}
function _scrollToLocationHash() {
  const element = document.getElementById(location.hash.slice(1));
  if (element) element.scrollIntoView();
}
/*export type NavigateFunction = (parts: string | PathParts) => void*/;
export const NavType = {
  Add: "Add",
  Replace: "Replace",
  AddAndReload: "AddAndReload",
  ReplaceAndReload: "ReplaceAndReload",
  OpenInNewTab: "OpenInNewTab",
};
function navigate(urlOrParts/*: string | PathParts*/, navType/*: NavType*/ = NavType.Add) {
  const newPath = makePath(urlOrParts);
  switch (navType) {
  case "Add":
  case "Replace":
    {
      const isExternalLink = !newPath.startsWith("/") && !newPath.startsWith(window.location.origin);
      if (isExternalLink) {navType = NavType.AddAndReload}
    }
  }
  switch (navType) {
  case "Add":
    history.pushState(null, "", newPath)
    _dispatchTargets.location.dispatch();
    break;
  case "Replace":
    history.replaceState(null, "", newPath)
    _dispatchTargets.location.dispatch();
    break;
  case "AddAndReload":
    location.href = newPath;
    break;
  case "ReplaceAndReload":
    location.replace(newPath);
    break;
  case "OpenInNewTab":
    window.open(newPath);
    break;
  }
}

// metadata
class ComponentMetadata {
  // state
  state/*: StringMap | undefined*/;
  prevState/*: any | null*/ = null;
  prevNode/*: NodeType | null*/ = null;
  prevBaseProps/*: InheritedBaseProps*/ = _START_BASE_PROPS;
  prevEvents/*: EventsMap*/ = {} /*as EventsMap*/;
  gcFlag/*: boolean*/ = false;
  onUnmount/*?: (removed: boolean) => void*/;
  // navigation
  prevBeforeNode/*: NodeType | null*/ = null;
  prevComponent/*: Component | null*/ = null;
  keyToChild/*: StringMap<ComponentMetadata>*/ = {};
  parent/*: ComponentMetadata | RootComponentMetadata | null*/;
  root/*: RootComponentMetadata*/;
  // debug
  prevIndexedChildCount/*: number | null*/ = null;
  constructor(parent/*: ComponentMetadata | RootComponentMetadata | null*/) {
    this.parent = parent;
    this.root = parent?.root ?? null /*as any*/;
  }
}
class RootComponentMetadata extends ComponentMetadata {
  component/*: Component*/;
  parentNode/*: ParentNodeType*/;
  willRerenderNextFrame/*: boolean*/ = false;
  constructor(component/*: Component*/, parentNode/*: ParentNodeType*/) {
    super(null);
    this.root = this;
    this.component = component;
    this.parentNode = parentNode;
  }
}

// render
export let SCROLLBAR_WIDTH = 0;
export let THIN_SCROLLBAR_WIDTH = 0;
function _computeScrollbarWidth() {
  let e = document.createElement("div");
  e.style.cssText = "overflow:scroll; visibility:hidden; position:absolute;";
  document.body.append(e);
  SCROLLBAR_WIDTH = e.offsetWidth - e.clientWidth;
  e.style.scrollbarWidth = "thin";
  THIN_SCROLLBAR_WIDTH = e.offsetWidth - e.clientWidth;
  e.remove();
  document.body.style.setProperty("--scrollbarWidth", addPx(SCROLLBAR_WIDTH));
  document.body.style.setProperty("--thinScrollbarWidth", addPx(THIN_SCROLLBAR_WIDTH));
}
function renderRoot(rootComponent/*: Component*/, parentNode/*: ParentNodeType | null*/ = null)/*: RootComponentMetadata*/ {
  const root_ = new RootComponentMetadata(rootComponent, parentNode /*as any*/);
  rootComponent._ = root_;
  const render = () => {
    root_.parentNode = root_.parentNode ?? document.body;
    if (SCROLLBAR_WIDTH === 0) _computeScrollbarWidth();
    _render(rootComponent, root_.parentNode);
    requestAnimationFrame(() => {
      _scrollToLocationHash();
    });
  }
  if (root_.parentNode ?? document.body) {
    render();
  } else {
    window.addEventListener("load", render);
  }
  return root_;
}
/*export type InheritedBaseProps = UndoPartial<Omit<BaseProps, "key" | "events">> & {className: string[]}*/;
export const _START_BASE_PROPS/*: InheritedBaseProps*/ = {
  attribute: {},
  className: [],
  cssVars: {},
  style: {},
};
// TODO: make this non-recursive for cleaner console errors
function _render(component/*: Component*/, parentNode/*: ParentNodeType*/, beforeNodeStack/*: (NodeType | null)[]*/ = [], _inheritedBaseProps/*: InheritedBaseProps*/ = _START_BASE_PROPS, isTopNode = true) {
  // render elements
  const {_, name, args, baseProps, props, onRender} = component;
  const {onMount, onUnmount} = onRender.bind(component)(...args, props) ?? {};
  const {node, children, indexedChildCount} = component; // NOTE: get after render
  const prevIndexedChildCount = _.prevIndexedChildCount;
  // inherit
  let inheritedBaseProps = {
    attribute: {..._inheritedBaseProps.attribute, ...baseProps.attribute},
    className: [..._inheritedBaseProps.className, ...baseProps.className],
    cssVars: {..._inheritedBaseProps.cssVars, ...baseProps.cssVars},
    style: {..._inheritedBaseProps.style, ...baseProps.style},
  };
  const prevNode = _.prevNode;
  const beforeNode = beforeNodeStack[beforeNodeStack.length - 1];
  if (node) {
    // append
    if (beforeNode && (beforeNode !== _.prevBeforeNode)) {
      beforeNode.after(node);
    } else if (!prevNode) {
      parentNode.prepend(node); // NOTE: prepend if no history
    }
    _.prevBeforeNode = beforeNode;
    if (node != prevNode) {
      if (prevNode) prevNode.remove();
      _.prevBaseProps = _START_BASE_PROPS;
      _.prevEvents = {} /*as EventsMap*/;
    }
    if (!(node instanceof Text)) {
      // style
      const styleDiff = getDiff(_.prevBaseProps.style, inheritedBaseProps.style);
      for (let {key, newValue} of styleDiff) {
        if (newValue != null) {
          node.style[key /*as any*/] = addPx(newValue);
        } else {
          node.style.removeProperty(key);
        }
      }
      // cssVars
      const cssVarsDiff = getDiff(_.prevBaseProps.cssVars, inheritedBaseProps.cssVars);
      for (let {key, newValue} of cssVarsDiff) {
        if (newValue != null) {
          node.style.setProperty(`--${key}`, addPx(newValue));
        } else {
          node.style.removeProperty(`--${key}`);
        }
      }
      // class
      if (name !== node.tagName.toLowerCase()) {
        inheritedBaseProps.className.push(camelCaseToKebabCase(name));
      };
      const classNameDiff = getDiffArray(_.prevBaseProps.className, inheritedBaseProps.className);
      for (let {key, newValue} of classNameDiff) {
        if (newValue != null) {
          if (key === "") console.warn("className cannot be empty,", name, inheritedBaseProps.className);
          if (key.includes(" ")) console.warn("className cannot contain whitespace,", name, inheritedBaseProps.className);
          node.classList.add(key);
        } else {
          node.classList.remove(key);
        }
      }
      // attribute
      const attributeDiff = getDiff(_.prevBaseProps.attribute, inheritedBaseProps.attribute);
      for (let {key, newValue} of attributeDiff) {
        if (newValue != null) {
          node.setAttribute(camelCaseToKebabCase(key), String(newValue));
        } else {
          node.removeAttribute(camelCaseToKebabCase(key));
        }
      }
      // events
      const eventsDiff = getDiff(_.prevEvents, baseProps.events ?? {});
      for (let {key, oldValue, newValue} of eventsDiff) {
        node.removeEventListener(key, oldValue /*as _EventListener*/);
        if (newValue) {
          const passive = key === "scroll" || key === "wheel";
          node.addEventListener(key, newValue /*as _EventListener*/, {passive});
        }
      }
      _.prevBaseProps = inheritedBaseProps;
      _.prevEvents = baseProps.events ?? {};
      parentNode = node;
      inheritedBaseProps = _START_BASE_PROPS;
      isTopNode = false;
    }
  } else {
    if (prevNode) {
      prevNode.remove(); // NOTE: removing components is handled by _unloadUnusedComponents()
      _.prevBaseProps = {} /*as InheritedBaseProps*/;
      _.prevEvents = {} /*as EventsMap*/;
    }
    if (name) inheritedBaseProps.className.push(camelCaseToKebabCase(name)); // NOTE: fragment has name: ''
  }
  // children
  const usedKeys = new Set();
  if (node) beforeNodeStack.push(null);
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    _setDefaultChildKey(component, child);
    const key = child.key;
    if (usedKeys.has(key)) console.warn(`Duplicate key: '${key}'`, component);
    usedKeys.add(key);
    const child_ = _.keyToChild[key] ?? new ComponentMetadata(_);
    _.keyToChild[key] = child_;
    child._ = child_;
    child_.gcFlag = _.gcFlag;
    _render(child, parentNode, beforeNodeStack, inheritedBaseProps, isTopNode);
  }
  if (node) {
    beforeNodeStack.pop();
    beforeNodeStack[beforeNodeStack.length - 1] = node;
  }
  // on mount
  _.prevNode = node;
  _.prevIndexedChildCount = indexedChildCount;
  _.prevState = {..._.state};
  const prevComponent = _.prevComponent;
  _.prevComponent = component;
  const prevOnOnmount = _.onUnmount;
  if (prevOnOnmount) prevOnOnmount(false);
  if (onMount) onMount();
  if (onUnmount) _.onUnmount = onUnmount;
  // warn if missing keys
  if (prevIndexedChildCount !== null && (indexedChildCount !== prevIndexedChildCount)) {
    console.warn(`Newly added/removed children should have a "key" prop. (${prevIndexedChildCount} -> ${indexedChildCount})`, prevComponent, component);
  }
}

// rerender
function _unloadUnusedComponents(prevComponent/*: Component*/, rootGcFlag/*: boolean*/) {
  for (let child of prevComponent.children) {
    const {gcFlag, parent, onUnmount, prevNode} = child._;
    if (gcFlag !== rootGcFlag) {
      _dispatchTargets.removeComponent(prevComponent);
      delete parent?.keyToChild[child.key];
      if (onUnmount) onUnmount(true);
      if (prevNode) prevNode.remove();
    }
    _unloadUnusedComponents(child, rootGcFlag);
  }
}
function moveRoot(root_/*: RootComponentMetadata*/, parentNode/*: ParentNodeType*/) {
  root_.parentNode = parentNode;
  if (root_.prevNode) parentNode.append(root_.prevNode);
}
function unloadRoot(root_/*: RootComponentMetadata*/) {
  _unloadUnusedComponents(root_.component, !root_.gcFlag);
}

// sizes
export const Size = {
  small:  "small",
  normal: "normal",
  big:    "big",
  bigger: "bigger",
};
// default colors
export const BASE_COLORS = {
  gray: "0.0, 0.85, 0, 0",
  secondary: "0.85, 0.45, 0.127, 250",
  red: "0.45, 0.85, 0.127, 25",
  //yellow: "0.45, 0.85, 0.127, 95", // TODO: yellow, green
  //green: "0.45, 0.85, 0.127, 145",
};
/*export type BaseColor = keyof typeof*/ BASE_COLORS; // TODO: remove this?
export const COLOR_SHADE_COUNT = 7;

/*
TODO: documentation
  renderRoot(), moveRoot(), unloadRoot()
  css utils
  router()
  validation api
    const validate = this.useValidate((errors) => {
      if (state.username.length < 4) errors.username = "Username must have at least 4 characters."
    });
    const onSubmit = () => {
      if (validate()) {
        // ...
      }
    }
  useLocalStorage()
*/
// TODO: more input components (icon button, radio, checkbox/switch, select, date/date range input, file input)
// TODO: badgeWrapper
// TODO: snackbar api
// https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-line-clamp ?
// TODO: dateTimeInput({locale: {daysInWeek: string[], firstDay: number, utcOffset: number}})
/*export type Route = {
  path: string;
  defaultPath?: string;
  component: ComponentFunction<[routeParams: any]>
  roles?: string[];
  wrapper?: boolean;
  showInNavigation?: boolean;
  label?: string;
  group?: string;
}*/;
/*export type FallbackRoute = Omit<Route, "path">*/;
/*export type RouterProps = {
  prefix?: string;
  routes: Route[];
  pageWrapperComponent?: ComponentFunction<[props: PageWrapperProps]>;
  contentWrapperComponent?: ComponentFunction<any>,
  currentRoles?: string[];
  isLoggedIn?: boolean;
  notLoggedInRoute?: FallbackRoute;
  notFoundRoute?: FallbackRoute;
  unauthorizedRoute?: FallbackRoute;
}*/;
/*export type PageWrapperProps = {
  routes: Route[];
  currentRoute: Route;
  routeParams: Record<string, string>,
  contentWrapperComponent: ComponentFunction<any>,
}*/;
export const router = makeComponent(function router(props/*: RouterProps*/) {
  const {
    prefix = "",
    routes,
    pageWrapperComponent = () => fragment(),
    contentWrapperComponent = () => div({ className: "page-content" }),
    currentRoles,
    isLoggedIn,
    notLoggedInRoute = { component: fragment },
    notFoundRoute,
    unauthorizedRoute = { component: fragment },
  } = props;
  this.useLocation(); // rerender on location change
  let currentPath = makePath({origin: '', query: '', hash: ''});
  let currentRoute/*: Route | null*/ = null;
  let currentRouteParams/*: Record<string, string>*/ = {};
  /*type RouteInfo = {
    route: Route;
    paramNames: string[];
    pathRegex: string;
    sortKey: string;
  }*/;
  const routeInfos/*: RouteInfo[]*/ = routes.map(route => {
    const routePrefix = currentPath.startsWith(prefix) ? prefix : "";
    const path = makePath({
      origin: '',
      pathname: routePrefix + route.path,
      query: '',
      hash: '',
    });
    const paramNames/*: string[]*/ = [];
    const pathRegex = path.replace(/:([^/]*)/g, (_m, g1) => {
      paramNames.push(g1);
      return `([^/?]*)`;
    });
    const sortKey = path.replace(/:([^/]*)/g, '');
    return {route, paramNames, pathRegex, sortKey};
  }).sort((a, b) => {
    const aKey = a.sortKey;
    const bKey = b.sortKey;
    return +(aKey < bKey) - +(aKey > bKey); // NOTE: sort descending
  });
  for (let routeInfo of routeInfos) {
    const regex = new RegExp(`^${routeInfo.pathRegex}$`);
    const match = currentPath.match(regex);
    if (match != null) {
      const routeParamEntries = routeInfo.paramNames.map((key, i) => [key, match[i + 1]]);
      currentRouteParams = Object.fromEntries(routeParamEntries);
      const route = routeInfo.route;
      const roles = route.roles ?? [];
      const needSomeRole = (roles.length > 0);
      const haveSomeRole = (currentRoles ?? []).some(role => roles.includes(role));
      if (!needSomeRole || haveSomeRole) {
        currentRoute = route;
      } else {
        currentRoute = {
          path: ".*",
          ...(isLoggedIn ? notLoggedInRoute : unauthorizedRoute),
        };
      }
      break;
    }
  }
  if (!currentRoute) {
    currentRoute = {path: '*', component: () => span("404 Not found")};
    if (notFoundRoute) {
      currentRoute = {...currentRoute, ...notFoundRoute};
    } else {
      console.warn(`Route '${currentPath}' not found. routes:`, routes);
    }
  }
  if (currentRoute.wrapper ?? true) {
    this.append(pageWrapperComponent({routes, currentRoute, routeParams: currentRouteParams, contentWrapperComponent}));
  } else {
    const contentWrapper = this.append(contentWrapperComponent());
    contentWrapper.append(currentRoute.component(currentRouteParams));
  }
});
export const fragment = makeComponent(function fragment(_props/*: BaseProps*/ = {}) {}, { name: '' });
export const ul = makeComponent(function ul(_props/*: BaseProps*/ = {}) {
  this.useNode(() => document.createElement("ul"));
});
export const ol = makeComponent(function ol(_props/*: BaseProps*/ = {}) {
  this.useNode(() => document.createElement("ol"));
});
export const li = makeComponent(function li(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(() => document.createElement("li"));
  this.append(text);
});
export const h1 = makeComponent(function h1(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(() => document.createElement("h1"));
  this.append(text);
});
export const h2 = makeComponent(function h2(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(() => document.createElement("h2"));
  this.append(text);
});
export const h3 = makeComponent(function h3(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(() => document.createElement("h3"));
  this.append(text);
});
export const h4 = makeComponent(function h4(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(() => document.createElement("h4"));
  this.append(text);
});
export const h5 = makeComponent(function h5(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(() => document.createElement("h5"));
  this.append(text);
});
export const h6 = makeComponent(function h6(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(() => document.createElement("h6"));
  this.append(text);
});
export const divider = makeComponent(function divider(vertical/*: boolean*/ = false, _props/*: BaseProps*/ = {}) {
  this.append(div({
    attribute: {dataVertical: vertical},
  }));
});
export const p = makeComponent(function p(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(() => document.createElement("p"));
  this.append(text);
});
export const b = makeComponent(function b(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(() => document.createElement("b"));
  this.append(text);
});
export const em = makeComponent(function em(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(() => document.createElement("em"));
  this.append(text);
});
export const br = makeComponent(function br(_props/*: BaseProps*/ = {}) {
  this.useNode(() => document.createElement("br"));
});
export const code = makeComponent(function code(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(() => document.createElement("code"));
  this.append(text);
});
export const button = makeComponent(function button(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(() => document.createElement("button"));
  this.append(text);
});
export const input = makeComponent(function input(_props/*: BaseProps*/ = {}) {
  this.useNode(() => document.createElement("input"));
});
/*export type TextAreaProps = BaseProps & {
  onPaste?: (event: ClipboardEvent, clipboardData: DataTransfer) => string;
}*/;
export const textarea = makeComponent(function textarea(props/*: TextAreaProps*/ = {}) {
  const {onPaste = (_event, clipboardData) => {
    return clipboardData.getData("Text");
  }} = props;
  const node = this.useNode(() => document.createElement("span"));
  node.contentEditable = "true";
  const events = this.baseProps.events;
  if (events.paste === undefined) {
    events.paste = (event) => {
      event.preventDefault();
      const replaceString = onPaste(event, event.clipboardData /*as DataTransfer*/)
      const selection = window.getSelection() /*as Selection*/;
      const {anchorOffset: selectionA, focusOffset: selectionB} = selection;
      const selectionStart = Math.min(selectionA, selectionB);
      const selectionEnd = Math.max(selectionA, selectionB);
      const prevValue = node.innerText;
      const newValue = prevValue.slice(0, selectionStart) + replaceString + prevValue.slice(selectionEnd)
      node.innerText = newValue;
      const newSelectionEnd = selectionStart + replaceString.length;
      selection.setPosition(node.childNodes[0], newSelectionEnd);
    }
  }
});
export const img = makeComponent(function img(src/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(() => document.createElement("img"));
  this.baseProps.attribute.src = src;
});
export const svg = makeComponent(function svg(svgText/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(() => {
    const tmp = document.createElement("span");
    tmp.innerHTML = svgText;
    return (tmp.children[0] ?? document.createElement("svg")) /*as NodeType*/;
  });
});
export const audio = makeComponent(function audio(src/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(() => document.createElement("audio"));
  this.baseProps.attribute.src = src;
});
export const video = makeComponent(function video(sources/*: string[]*/, _props/*: BaseProps*/ = {}) {
  this.useNode(() => {
    const node = document.createElement("video");
    for (let source of sources) {
      const sourceNode = document.createElement("source");
      sourceNode.src = source;
      node.append(sourceNode);
    }
    return node;
  }, JSON.stringify(sources));
});
export const div = makeComponent(function div(_props/*: BaseProps*/ = {}) {
  this.useNode(() => document.createElement('div'));
});
export const legend = makeComponent(function legend(text/*: string*/, _props/*: BaseProps*/ = {}) {
  this.useNode(() => document.createElement("legend"));
  this.append(text);
  this.baseProps.className.push("ellipsis");
});

// span
/*export type SpanProps = BaseProps & {
  iconName?: string;
  size?: Size;
  color?: string;
  singleLine?: string;
  fontFamily?: string;
  href?: string;
  download?: string;
  navType?: NavType;
  id?: string;
  selfLink?: string;
  onClick?: (event: PointerEvent) => void;
}*/;
export const span = makeComponent(function _span(text/*: string | number | null | undefined*/, props/*: SpanProps*/ = {}) {
  let { iconName, size, color, singleLine, fontFamily, href, download, navType, id, selfLink, onClick } = props;
  if (selfLink != null) {
    const selfLinkWrapper = this.append(div({ className: "self-link", attribute: { id: id == null ? selfLink : id } }));
    selfLinkWrapper.append(span(text, {...props, selfLink: undefined}));
    selfLinkWrapper.append(icon("tag", { size: Size.normal, href: `#${selfLink}` }));
    return;
  }
  const isLink = (href != null);
  const element = this.useNode(() => document.createElement(isLink ? 'a' : 'span'));
  const {attribute, className, style, events} = this.baseProps;
  if (id) attribute.id = id;
  if (download) attribute.download = download;
  if (size) attribute.dataSize = size;
  if (iconName) className.push("material-symbols-outlined");
  if (color) style.color = `var(--${color})`;
  if (singleLine) className.push("ellipsis");
  if (fontFamily) style.fontFamily = `var(--fontFamily-${fontFamily})`;
  if (isLink) (element /*as HTMLAnchorElement*/).href = href;
  if (onClick || href) {
    if (!isLink) {
      attribute.tabindex = "-1";
      attribute.clickable = "true";
    }
    if (events.touchstart === undefined) {
      events.touchstart = ((event/*: TouchEvent*/) => {
        event.preventDefault();
      });
    }
    // TODO!: do we need to implement our own onClick, or can we just use pointerup?
    if (events.pointerdown === undefined) {
      events.pointerdown = onClick;
    }
    if (events.pointerup === undefined) {
      events.pointerup = ((event/*: PointerEvent*/) => {
        if (href && !download) {
          event.preventDefault();
          navigate(href, navType);
        }
      });
    }
  }
  this.append(iconName || (text == null ? "" : String(text)))
}, { name: "span" });
// https://fonts.google.com/icons
/*export type IconProps = SpanProps*/;
export const icon = makeComponent(function icon(iconName/*: string*/, props/*: IconProps*/ = {}) {
  let {size, style = {}, ...extraProps} = props;
  this.baseProps.attribute.dataIcon = iconName;
  this.append(span("", {iconName, size, style, ...extraProps}));
});
function generateFontSizeCssVars(names/*: string[]*/ = Object.values(Size)) {
  /*type SizeDef = {
    fontSize: number;
    iconSize: number;
    size: number;
  }*/;
  const getSizeDef = (i/*: number*/) => ({
    size: 19 + i*4,
    iconSize: 14 + i*4,
    fontSize: 14 + i*4,
  }) /*as SizeDef*/;
  let acc = "  /* generated by generateFontSizeCssVars */";
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const {size, fontSize, iconSize} = getSizeDef(i);
    acc += `\n  --size-${name}: ${size}px;`;
    acc += `\n  --iconSize-${name}: ${iconSize}px;`;
    acc += `\n  --fontSize-${name}: ${fontSize}px;`;
  }
  return acc;
}
setTimeout(() => {
  //console.log(generateFontSizeCssVars());
})
/*export type InputProps = {
  type?: "text";
  placeholder?: string;
  value: string | number | null | undefined;
  autoFocus?: boolean;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onRawInput?: (event: InputEventWithTarget) => void;
  onInput?: (event: InputEventWithTarget) => void;
  onChange?: (event: ChangeEventWithTarget) => void;
  allowDisplayString?: (value: string) => boolean;
  allowString?: (value: string) => string | undefined;
} & BaseProps*/;
export const controlledInput = makeComponent(function controlledInput(props/*: InputProps*/) {
  const { type = "text", placeholder, value, autoFocus, onFocus, onBlur, onKeyDown, onRawInput, onInput, onChange,
    allowDisplayString = () => true,
    allowString = (value) => value,
  } = props;
  const [state] = this.useState({ prevAllowedDisplayString: String(value ?? ''), prevAllowedString: '' });
  state.prevAllowedString = String(value ?? '');
  const element = this.useNode(() => document.createElement('input'));
  element.type = type;
  if (placeholder) element.placeholder = placeholder;
  if (autoFocus) element.autofocus = true;
  if (value != null) element.value = String(value);
  element.onfocus = onFocus /*as _EventListener*/;
  element.onblur = onBlur /*as _EventListener*/;
  element.onkeydown = onKeyDown /*as _EventListener*/;
  element.oninput = (_event) => {
    const event = _event /*as InputEventWithTarget*/;
    if (event.data != null && !allowDisplayString(element.value)) {
      event.preventDefault();
      event.stopPropagation();
      element.value = state.prevAllowedDisplayString;
      return;
    }
    state.prevAllowedDisplayString = element.value;
    if (onRawInput) onRawInput(event);
    const allowedString = allowString(element.value);
    if (allowedString === element.value && onInput) onInput(event);
  }
  element.onchange = (_event) => { // NOTE: called only on blur
    const event = _event /*as ChangeEventWithTarget*/;
    const allowedString = allowString(element.value) ?? state.prevAllowedString;
    state.prevAllowedString = allowedString;
    if (element.value !== allowedString) {
      element.value = allowedString;
      const target = event.target;
      if (onRawInput) onRawInput({target} /*as InputEventWithTarget*/);
      if (onInput) onInput({target} /*as InputEventWithTarget*/);
    }
    if (onChange) onChange(event);
  };
});
/*export type LabeledInputProps = {
  label?: string;
  leftComponent?: () => Component;
  inputComponent: Component;
  rightComponent?: () => Component;
} & BaseProps*/;
export const labeledInput = makeComponent(function labeledInput(props/*: LabeledInputProps*/) {
  const {label = " ", leftComponent, inputComponent, rightComponent} = props;
  const fieldset = this.useNode(() => document.createElement("fieldset"));
  fieldset.onpointerdown = (_event/*: PointerEvent*/) => {
    const inputNode = inputComponent._.prevNode /*as ParentNodeType*/;
    inputNode.focus(); // TODO: does this break mobile text select or not?
  }
  this.append(legend(label))
  if (leftComponent) this.append(leftComponent());
  this.append(inputComponent);
  if (rightComponent) this.append(rightComponent());
});
export const errorMessage = makeComponent(function errorMessage(error/*: string*/, props/*: SpanProps*/ = {}) {
  this.append(span(error, {color: "red", size: Size.small, ...props}));
});

/*export type TextInputProps = Omit<InputProps, "value"> & Omit<LabeledInputProps, "inputComponent"> & {
  error?: string,
  value: string | null | undefined;
}*/;
export const textInput = makeComponent(function textInput(props/*: TextInputProps*/) {
  const {label, leftComponent, rightComponent, error, ...extraProps} = props;
  this.append(labeledInput({
    label,
    leftComponent,
    inputComponent: controlledInput(extraProps),
    rightComponent,
  }));
  if (error) this.append(errorMessage(error));
});
/*export type UseOnPointerMoveValue = {
  rect: DOMRect;
  fractionX: number;
  fractionY: number;
}*/;
/*export type UseOnPointerMoveProps = {
  getNode?: (node: ParentNodeType) => ParentNodeType;
  onPointerDown?: (event: PointerEvent, value: UseOnPointerMoveValue) => void;
  onPointerMove?: (event: PointerEvent, value: UseOnPointerMoveValue) => void;
  onPointerUp?: (event: PointerEvent, value: UseOnPointerMoveValue) => void;
}*/;
/*export type UseOnPointerMove = {
  onPointerDown: (event: PointerEvent) => void;
}*/;
function useOnPointerMove(props/*: UseOnPointerMoveProps*/)/*: UseOnPointerMove*/ {
  const {
    getNode = (v) => v,
    onPointerDown: userOnPointerDown,
    onPointerMove: userOnPointerMove,
    onPointerUp: userOnPointerUp,
  } = props;
  // NOTE: this will be recreated on next render, but remembered by the callback :shrug:
  const ref = {startTarget: null /*as ParentNodeType | null*/};
  const getPointerPosition = (event/*: PointerEvent*/) => {
    if (ref.startTarget === null) {
      ref.startTarget = event.target /*as ParentNodeType*/;
    }
    const node = getNode(ref.startTarget /*as ParentNodeType*/);
    const rect = node.getBoundingClientRect();
    const fractionX = (event.clientX - rect.left) / rect.width;
    const fractionY = (event.clientY - rect.top) / rect.height;
    return {rect, fractionX, fractionY};
  }
  const onPointerMove = (event/*: PointerEvent*/) => {
    if (userOnPointerMove) userOnPointerMove(event, getPointerPosition(event));
  };
  const onPointerUp = (event/*: any*/) => {
    window.removeEventListener("pointercancel", onPointerUp);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointermove", onPointerMove);
    if (userOnPointerUp) userOnPointerUp(event, getPointerPosition(event));
  };
  const onPointerDown = (event/*: PointerEvent*/) => {
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);
    event.preventDefault();
    if (userOnPointerDown) userOnPointerDown(event, getPointerPosition(event));
  };
  return {onPointerDown};
}

// slider input
/*export type SliderInputProps = BaseProps & {
  range: [number, number];
  decimalPlaces?: number;
  value?: number | null;
  onInput?: (event: {target: {value: number}}) => void;
  onChange?: (event: {target: {value: number}}) => void;
  railProps?: BaseProps;
  knobProps?: BaseProps;
}*/;
export const sliderInput = makeComponent(function sliderInput(props/*: SliderInputProps*/) {
  const {range, decimalPlaces, value, onInput, onChange, railProps, knobProps} = props;
  const [state, setState] = this.useState({
    value: range[0],
  });
  if (value != null) state.value = value;
  // elements
  let t = unlerp(state.value ?? range[0], range[0], range[1]);
  t = clamp(t, 0, 1);
  const leftPercent = addPercent(t);
  const element = this.useNode(() => document.createElement("div"));
  const rail = this.append(div({className: "slider-input-rail", ...railProps}));
  rail.append(div({
    className: "slider-input-rail slider-input-color-rail",
    style: {width: leftPercent},
    ...knobProps,
  }));
  rail.append(div({
    className: "slider-input-knob",
    style: {left: leftPercent},
    ...knobProps,
  }));
  // events
  const updateValue = (pointerPos/*: UseOnPointerMoveValue*/) => {
    const {fractionX} = pointerPos;
    let newValue = lerp(fractionX, range[0], range[1]);
    newValue = +newValue.toFixed(decimalPlaces ?? 0);
    newValue = clamp(newValue, range[0], range[1]);
    setState({value: newValue});
    if (onInput) onInput({target: {value: newValue}});
  }
  const {onPointerDown} = useOnPointerMove({
    getNode: () => rail.getNode() /*as ParentNodeType*/,
    onPointerDown: (_event, pointerPos) => updateValue(pointerPos),
    onPointerMove: (_event, pointerPos) => updateValue(pointerPos),
    onPointerUp: (_event, pointerPos) => {
      updateValue(pointerPos);
      if (onChange) onChange({target: {value: state.value}});
    },
  });
  element.onpointerdown = onPointerDown;
});
/*export type NumberArrowProps = {
  onClickUp?: (event: PointerEvent) => void;
  onClickDown?: (event: PointerEvent) => void;
} & BaseProps*/;
export const numberArrows = makeComponent(function numberArrows(props/*: NumberArrowProps*/ = {}) {
  const { onClickUp, onClickDown } = props;
  this.useNode(() => document.createElement("div"));
  this.append(icon("arrow_drop_up", {size: Size.small, onClick: onClickUp}));
  this.append(icon("arrow_drop_down", {size: Size.small, onClick: onClickDown}));
  this.append(div({className: "number-arrows-divider"}));
});
/*export type NumberInputProps = InputProps & Omit<LabeledInputProps, "inputComponent"> & {
  error?: string,
  min?: number,
  max?: number,
  step?: number,
  stepPrecision?: number,
  clearable?: boolean,
  onRawInput?: ((event: InputEventWithTarget) => void);
  onInput?: ((event: InputEventWithTarget) => void);
  onChange?: ((event: ChangeEventWithTarget) => void)
}*/;
export const numberInput = makeComponent(function numberInput(props/*: NumberInputProps*/) {
  const {
    label, leftComponent, rightComponent, error, // labeledInput
    value, min, max, step, stepPrecision, clearable = true, onKeyDown, onRawInput, onInput, onChange, ...extraProps // numberInput
  } = props;
  const stepAndClamp = (number/*: number*/) => {
    if (step) {
      const stepOffset = min ?? max ?? 0;
      number = stepOffset + Math.round((number - stepOffset) / step) * step;
    }
    number = Math.min(number, max ?? 1/0);
    number = Math.max(min ?? -1/0, number);
    const defaultStepPrecision = String(step).split(".")[1]?.length ?? 0;
    return number.toFixed(stepPrecision ?? defaultStepPrecision);
  };
  const incrementValue = (by/*: number*/) => {
    const number = stepAndClamp(+(value ?? 0) + by);
    const newValue = String(number);
    const target = inputComponent._.prevNode /*as HTMLInputElement*/;
    target.value = newValue;
    if (onRawInput) onRawInput({target} /*as unknown*/ /*as InputEventWithTarget*/);
    if (onInput) onInput({target} /*as unknown*/ /*as InputEventWithTarget*/);
    if (onChange) onChange({target} /*as ChangeEventWithTarget*/);
  };
  const inputComponent = controlledInput({
    value,
    onKeyDown: (event/*: KeyboardEvent*/) => {
      switch (event.key) {
        case "ArrowUp":
          incrementValue(step ?? 1);
          event.preventDefault();
          break;
        case "ArrowDown":
          incrementValue(-(step ?? 1));
          event.preventDefault();
          break;
      }
      if (onKeyDown) onKeyDown(event);
    },
    onRawInput,
    onInput,
    onChange,
    ...extraProps,
    allowDisplayString: (value) => value.split("").every((c, i) => {
      if (c === "-" && i === 0) return true;
      if (c === "." && ((step ?? 1) % 1) !== 0) return true;
      return "0123456789".includes(c);
    }),
    allowString: (value) => {
      const isAllowed = (value === "") ? clearable : !isNaN(+value);
      if (isAllowed) {
        return String(stepAndClamp(+value));
      }
    }
  });
  this.append(labeledInput({
    label,
    leftComponent,
    inputComponent,
    rightComponent: () => {
      const acc = fragment();
      if (rightComponent) acc.append(rightComponent());
      acc.append(numberArrows({
        onClickUp: (_event/*: PointerEvent*/) => {
          incrementValue(step ?? 1);
          inputComponent._.state/*!*/.needFocus = true;
          inputComponent.rerender();
        },
        onClickDown: (_event/*: PointerEvent*/) => {
          incrementValue(-(step ?? 1));
          inputComponent._.state/*!*/.needFocus = true;
          inputComponent.rerender();
        },
      }));
      return acc;
    },
  }));
  if (error) this.append(errorMessage(error));
});
/*export type ButtonProps = {
  size?: Size;
  color?: BaseColor;
  onClick?: () => void;
  disabled?: boolean;
}
*/export const coloredButton = makeComponent(function coloredButton(text/*: string*/, props/*: ButtonProps*/ = {}) {
  const {size, color, onClick, disabled} = props;
  const element = this.useNode(() => document.createElement("button"));
  if (text) this.append(span(text));
  const {attribute} = this.baseProps;
  if (size) attribute.dataSize = size;
  if (color) attribute.dataColor = color;
  if (disabled) attribute.disabled = "true";
  else if (onClick) {
    element.onpointerdown = () => {
      onClick();
    }
  }
});
/*type _GPU = {
  requestAdapter(): Promise<_GPUAdapter>;
  getPreferredCanvasFormat(): any;
}*/;
/*type _GPUAdapter = {
  requestDevice(): Promise<_GPUDevice>;
}*/;
/*type _GPUDevice = {
  createShaderModule(options: {code: string}): _GPUShaderModule;
}*/;

/*type _GPUShaderModule = any*/;
/*declare global {
  interface Window {
    GPUBufferUsage: {
      COPY_DST: number;
      COPY_SRC: number;
      INDEX: number;
      INDIRECT: number;
      MAP_READ: number;
      MAP_WRITE: number;
      QUERY_RESOLVE: number;
      STORAGE: number;
      UNIFORM: number;
      VERTEX: number;
    }
  }
  interface Navigator {
    gpu: _GPU | undefined;
  }
}

*//*type WebgpuContextType = {
  configure: (options: any) => void;
}*/;

/* component */
/*type WebgpuRenderProps = {
  // NOTE: any because we don't have the complete types..
  gpu: any;
  context: any;
  device: any;
  shaderModule: any;
  data: any; // custom user data
}*/;
/*type WebgpuProps = {
  shaderCode: string;
  init?: (props: WebgpuRenderProps) => any;
  render?: (props: WebgpuRenderProps) => void;
} & BaseProps*/;
export const webgpu = makeComponent(function webgpu(props/*: WebgpuProps*/) {
  const {shaderCode, init, render} = props;
  const [state] = this.useState({
    _isDeviceInitialized: false,
    device: null /*as _GPUDevice | null*/,
    shaderModule: null /*as any*/,
    context: null /*as WebgpuContextType | null*/,
    data: null /*as any*/,
  });
  const node = this.useNode(() => document.createElement("canvas"));

  const {gpu} = navigator;
  if (!state._isDeviceInitialized) {
    state._isDeviceInitialized = true;
    if (!gpu) {
      console.error("WebGPU is not supported in this browser.")
      return;
    }
    gpu.requestAdapter().then((adapter) => {
      if (!adapter) {
        console.error("Couldn't request WebGPU adapter.");
        return;
      }
      adapter.requestDevice().then((device) => {
        state.device = device;
        // TODO: create/delete shaders dynamically (device.destroy()?)?
        state.shaderModule = device.createShaderModule({code: shaderCode});
        this.rerender();
      });
    });
  }
  if (!state.context && state.device) {
    state.context = node.getContext("webgpu") /*as unknown*/ /*as WebgpuContextType | null*/;
    state.context?.configure({
      device: state.device,
      format: gpu?.getPreferredCanvasFormat(),
      alphaMode: 'premultiplied',
    });
    if (init) {
      state.data = init({gpu, ...state});
    }
  }
  return {
    onMount: () => {
      // autosize canvas
      const rect = node.getBoundingClientRect();
      node.width = rect.width;
      node.height = rect.height;
      // render
      if (state.context && state.device && state.shaderModule && render) {
        render({gpu, ...state});
      }
    }
  }
});
/*type ErrorValue = any[] | undefined*/;
function glGetShaderLog(gl/*: WebGL2RenderingContext*/, shader/*: WebGLShader*/, shaderCode/*: string*/) {
  const shaderLines = shaderCode.split("\n");
  const rawShaderLog = gl.getShaderInfoLog(shader) ?? "";
  let prevLineNumberToShow = null /*as number | null*/;
  let acc = "";
  for (let logLine of rawShaderLog.split("\n")) {
    const match = logLine.match(/^ERROR: \d+:(\d+)/);
    let lineNumberToShow = null /*as number | null*/;
    if (match != null) {
      lineNumberToShow = +match[1] - 1;
    }
    if (prevLineNumberToShow != null && prevLineNumberToShow !== lineNumberToShow) {
      const line = (shaderLines[prevLineNumberToShow] ?? "").trim()
      prevLineNumberToShow = lineNumberToShow;
      acc += `  ${line}\n${logLine}\n`;
    } else {
      prevLineNumberToShow = lineNumberToShow;
      acc += `${logLine}\n`;
    }
  }
  return acc;
}
function glCompileShader(gl/*: WebGL2RenderingContext*/, program/*: WebGLProgram*/, shaderType/*: number*/, shaderCode/*: string*/)/*: ErrorValue*/ {
  const shader = gl.createShader(shaderType);
  while (1) {
    if (!shader) break;
    gl.shaderSource(shader, shaderCode);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) break;
    gl.attachShader(program, shader);
    return;
  }
  const ShaderTypeName/*: Record<any, string | undefined>*/ = {
    [gl.VERTEX_SHADER]: ".VERTEX_SHADER",
    [gl.FRAGMENT_SHADER]: ".FRAGMENT_SHADER",
  };
  const shaderLog = glGetShaderLog(gl, shader/*!*/, shaderCode);
  return [
    `Could not compile shader:\n${shaderLog}`,
    {
      program,
      shaderType: ShaderTypeName[shaderType] ?? shaderType,
      shaderCode,
      shader,
    }
  ]
}
function glCompileProgram(gl/*: WebGL2RenderingContext*/, programInfo/*: GLProgramInfo*/)/*: ErrorValue*/ {
  const {program, vertex, fragment} = programInfo;
  let error = glCompileShader(gl, program, gl.VERTEX_SHADER, vertex);
  if (error) return error;

  error = glCompileShader(gl, program, gl.FRAGMENT_SHADER, fragment);
  if (error) return error;

  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const programLog = gl.getProgramInfoLog(program);
    return [`Error linking shader program:\n${programLog}`, {program}]
  }
  gl.useProgram(program);
}
function glDecodeVertexAttributeType(gl/*: WebGL2RenderingContext*/, flatType/*: GLenum*/)/*: [GLenum, number]*/ {
  switch (flatType) {
  /* WebGL */
  case gl.FLOAT:
    return [gl.FLOAT, 1];
  case gl.FLOAT_VEC2:
    return [gl.FLOAT, 2];
  case gl.FLOAT_VEC3:
    return [gl.FLOAT, 3];
  case gl.FLOAT_VEC4:
    return [gl.FLOAT, 4];
  case gl.FLOAT_MAT2:
    return [gl.FLOAT, 4];
  case gl.FLOAT_MAT3:
    return [gl.FLOAT, 9];
  case gl.FLOAT_MAT4:
    return [gl.FLOAT, 16];
  // NOTE: non-square matrices are only valid as uniforms
  /* WebGL2 */
  case gl.INT:
    return [gl.INT, 1];
  case gl.INT_VEC2:
    return [gl.INT, 2];
  case gl.INT_VEC3:
    return [gl.INT, 3];
  case gl.INT_VEC4:
    return [gl.INT, 4];
  case gl.UNSIGNED_INT:
    return [gl.UNSIGNED_INT, 1];
  case gl.UNSIGNED_INT_VEC2:
    return [gl.UNSIGNED_INT, 2];
  case gl.UNSIGNED_INT_VEC3:
    return [gl.UNSIGNED_INT, 3];
  case gl.UNSIGNED_INT_VEC4:
    return [gl.UNSIGNED_INT, 4];
  }
  console.error('Uknown vertexAttribute type:', {flatType});
  return [-1, -1];
}
// user utils
function glUseProgram(gl/*: WebGL2RenderingContext*/, programInfo/*: GLProgramInfo*/) {
  gl.useProgram(programInfo.program);
  gl.bindVertexArray(programInfo.vao);
}
function glSetBuffer(gl/*: WebGL2RenderingContext*/, bufferInfo/*: GLBufferInfo*/, data/*: any*/) {
  const {location, count, type, bufferIndex} = bufferInfo;
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferIndex);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  const FLOAT_SIZE = 4; // we are assuming `#precision highp float;`
  if (type === gl.FLOAT) {
    let currentLocation = location;
    let remainingCount = count;
    const stride = count * FLOAT_SIZE;
    let currentOffset = 0;
    while (remainingCount >= 4) {
      gl.enableVertexAttribArray(currentLocation);
      gl.vertexAttribPointer(currentLocation++, 4, type, false, stride, currentOffset);
      remainingCount -= 4;
      currentOffset += 4 * FLOAT_SIZE;
    }
    if (remainingCount > 0) {
      gl.enableVertexAttribArray(currentLocation);
      gl.vertexAttribPointer(currentLocation++, remainingCount, type, false, stride, currentOffset);
    }
  } else {
    gl.enableVertexAttribArray(location);
    gl.vertexAttribIPointer(location, count, type, 0, 0);
  }
}

// data
/*export type GLBufferInfo = {
  location: number;
  count: number; // can be >4 for matrices
  type: GLenum; // gl.FLOAT | ...
  bufferIndex: WebGLBuffer;
}*/;

/*export type GLProgramDescriptor = {
  vertex: string;
  fragment: string;
}*/;
/*export type GLProgramInfo = {
  program: WebGLProgram;
  vertex: string;
  fragment: string;
  vao: WebGLVertexArrayObject;
  buffers: Record<string, GLBufferInfo>;
} & Record<`v_${string}`, GLBufferInfo> & Record<`u_${string}`, WebGLUniformLocation>*/;

// component
/*type WebGLState = {
  gl: WebGL2RenderingContext;
  programs: Record<string, GLProgramInfo>;
  rect: DOMRect;
  didCompile: boolean;
}*/;
/*export type WebGLProps = BaseProps & {
  programs: Record<string, GLProgramDescriptor>;
  renderResolutionMultiplier?: number;
  render?: (state: WebGLState) => void;
}
*/export const webgl = makeComponent(function webgl(props/*: WebGLProps*/) {
  const {
    programs,
    renderResolutionMultiplier = 1.0,
    render = ({gl}) => {
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }} = props;
  const node = this.useNode(() => document.createElement("canvas"));
  /*type PartiallyUninitialized<T, K extends keyof T> = Omit<T, K> & {[K2 in K]: T[K2] | null}*/;
  /*type WebGlStateUninitialized = PartiallyUninitialized<WebGLState, 'gl' | 'programs'>*/;
  const [state] = this.useState/*<WebGlStateUninitialized>*/({
    gl: null,
    programs: null,
    rect: new DOMRect(),
    didCompile: false,
  });
  if (state.gl == null) {
    const gl = node.getContext("webgl2");
    if (!gl) return;
    state.gl = gl;
    // init shaders
    state.programs = {};
    const DEFAULT_SHADER_VERSION = "#version 300 es\n";
    const DEFAULT_FLOAT_PRECISION = "precision highp float;\n"
    const addShaderHeader = (headerCode/*: string*/, shaderCode/*: string*/) => {
      return shaderCode.trimStart().startsWith("#version") ? shaderCode : headerCode + shaderCode
    }
    for (let [k, _programInfo] of Object.entries(programs)) {
      const programInfo = _programInfo /*as GLProgramInfo*/;
      state.programs[k] = programInfo;
      // compile
      programInfo.program = gl.createProgram();
      programInfo.vertex = addShaderHeader(DEFAULT_SHADER_VERSION, programInfo.vertex);
      programInfo.fragment = addShaderHeader(DEFAULT_SHADER_VERSION + DEFAULT_FLOAT_PRECISION, programInfo.fragment);
      let error = glCompileProgram(gl, programInfo);
      if (error) {
        console.error(...error);
        break;
      }
      state.didCompile = true;
      // init vertex buffers
      programInfo.vao = gl.createVertexArray(); // vao means vertexBuffer[]
      gl.bindVertexArray(programInfo.vao);
      const vertexBufferCount = gl.getProgramParameter(programInfo.program, gl.ACTIVE_ATTRIBUTES);
      for (let i = 0; i < vertexBufferCount; i++) {
        const vertexAttribute = gl.getActiveAttrib(programInfo.program, i);
        if (vertexAttribute == null) {
          console.error(`Couldn't get vertexAttribute:`, {i});
          continue
        }
        const vertexAttributeLocation = gl.getAttribLocation(programInfo.program, vertexAttribute.name);
        if (vertexAttributeLocation == null) {
          console.error(`Couldn't get vertexAttribute location:`, {i, vertexAttribute});
          continue
        }
        const [type, count] = glDecodeVertexAttributeType(gl, vertexAttribute.type);
        programInfo[vertexAttribute.name /*as `v_${string}`*/] = {
          location: vertexAttributeLocation,
          count,
          type,
          bufferIndex: gl.createBuffer(),
        };
      }
      // get uniform locations
      const uniformCount = gl.getProgramParameter(programInfo.program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < uniformCount; i++) {
        const uniform = gl.getActiveUniform(programInfo.program, i);
        if (uniform == null) {
          console.error(`Couldn't get uniform:`, {i});
          continue
        }
        const uniformLocation = gl.getUniformLocation(programInfo.program, uniform.name);
        if (uniformLocation == null) {
          console.error(`Couldn't get uniform location:`, {i, uniform});
          continue
        }
        programInfo[uniform.name /*as `u_${string}`*/] = uniformLocation;
      }
    }
  }
  return {
    onMount: () => {
      // autosize canvas
      const rect = node.getBoundingClientRect();
      rect.width *= renderResolutionMultiplier;
      rect.height *= renderResolutionMultiplier;
      node.width = rect.width;
      node.height = rect.height;
      state.rect = rect;
      // render
      const {gl, didCompile} = state;
      if (didCompile && gl != null) {
        gl.viewport(0, 0, rect.width, rect.height);
        render(state /*as WebGLState*/);
      }
    },
  }
});
export const loadingSpinner = makeComponent(function loadingSpinner(props/*: IconProps*/ = {}) {
  this.append(icon("progress_activity", props));
});
/*export type ProgressProps = {
  color?: string;
  fraction?: number;
} & BaseProps*/;
export const progress = makeComponent(function progress(props/*: ProgressProps*/ = {}) {
  const {color, fraction} = props;
  if (color) this.baseProps.style.color = `var(--${color})`;
  const wrapper = this.append(div({}));
  wrapper.append(div(fraction == null
    ? {className: 'progress-bar progress-bar-indeterminate'}
    : {className: 'progress-bar', style: {width: addPercent(fraction)}}
  ));
});
// tabs
/*export type TabsOptionComponentProps = {key: string, className: string}*/;
/*export type TabsOption = {
  id?: string | number;
  label: string;
  href?: string;
}*/;
/*export type TabsProps = BaseProps & {
  options: TabsOption[];
  selectedId: string | number;
  setSelectedId: (newId: string | number) => void;
}*/;
export const tabs = makeComponent(function tabs(props/*: TabsProps*/) {
  const {options, setSelectedId} = props;
  let {selectedId} = props;
  if (selectedId == null) selectedId = options[0].id ?? 0;
  const tabsHeader = this.append(div({className: "tabs-header"}));
  options.forEach((option, i) => {
    const optionId = option.id ?? i;
    tabsHeader.append(span(option.label, {
      key: optionId,
      href: option.href,
      className: "tabs-option",
      attribute: {dataSelected: optionId === selectedId, title: option.label},
      events: {click: () => setSelectedId(optionId)},
    }));
  });
});
const request_cache/*: Record<string, any>*/ = {};
function defaultOnError(error/*: Response*/) {
  console.error(error);
}
/*type ResponseType = 'json' | 'text' | 'blob'*/;

/*type UseCachedRequestProps<R extends ResponseType> = {
  component: Component | undefined;
  url: RequestInfo | URL;
  responseType?: R;
  onError?: (error: Response) => void;
} & RequestInit*/;
/*type UseCachedRequest<T, R extends ResponseType> = {
  data: R extends 'text' ? string | undefined : (
    R extends 'blob' ? Blob | undefined : T | undefined
  );
  refetch: () => void;
}*/;
function useCachedRequest/*<T, R extends ResponseType = 'json'>*/(props/*: UseCachedRequestProps<R>*/)/*: UseCachedRequest<T, R>*/ {
  const {component, url, responseType = 'json', onError = defaultOnError, ...extraOptions} = props;
  const cache_key = [
    url,
    props.method ?? 'GET',
    JSON.stringify(props.headers ?? {}),
    JSON.stringify(props.body ?? {}),
  ].join(',');
  const cached_response = request_cache[cache_key];
  if (cached_response === undefined) {
    request_cache[cache_key] = null;
    fetch(url, extraOptions).then(async (response) => {
      let response_mapped;
      switch (responseType) {
      case 'json':
        response_mapped = await response.json();
        break;
      case 'text':
        response_mapped = await response.text();
        break;
      case 'blob':
        response_mapped = await response.blob();
        break;
      }
      request_cache[cache_key] = response_mapped;
      component?.rerender();
    }).catch(onError);
  }
  return {
    data: cached_response ?? undefined,
    refetch: () => {
      delete request_cache[cache_key];
      component?.rerender();
    },
  };
}
function clearRequestCache(prefix/*: string*/ = '') {
  for (let key of Object.keys(request_cache)) {
    if (key.startsWith(prefix)) {
      delete request_cache[key];
    }
  }
}
function camelCaseToKebabCase(key/*: string*/) {
  return (key.match(/[A-Z][a-z]*|[a-z]+/g) ?? []).map(v => v.toLowerCase()).join("-");
}
function removePrefix(value/*: string*/, prefix/*: string*/)/*: string*/ {
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}
function removeSuffix(value/*: string*/, prefix/*: string*/)/*: string*/ {
  return value.endsWith(prefix) ? value.slice(value.length - prefix.length) : value;
}

// css
function rgbFromHexString(hexString/*: string*/)/*: string*/ {
  let hexString2 = removePrefix(hexString.trim(), '#');
  return `${parseInt(hexString2.slice(0, 2), 16)}, ${parseInt(hexString2.slice(2, 4), 16)}, ${parseInt(hexString2.slice(4, 6), 16)}`;
}
function addPx(pixelsOrString/*: string | number*/) {
  return is_number(pixelsOrString) ? `${pixelsOrString}px` : pixelsOrString /*as string*/;
}
function addPercent(fractionOrString/*: string | number*/) {
  return is_number(fractionOrString) ? `${(fractionOrString * 100).toFixed(2)}%` : fractionOrString /*as string*/;
}

/** Return stringified JSON with extra undefineds for printing */
function stringifyJs(v/*: any*/)/*: string*/ {
  if (v === undefined) return "undefined";
  return JSON.stringify(v); // TODO: also handle nested undefineds
}

// json
function stringifyJson(v/*: any*/)/*: string*/ {
  return JSON.stringify(v);
}
function parseJson(v/*: string*/)/*: any*/ {
  return JSON.parse(v);
}
/** Return stringified JSON with object keys and arrays sorted */
function stringifyJsonStable(data/*: Record<string, any>*/)/*: string*/ {
  const replacer = (_key/*: string*/, value/*: any*/) =>
    value instanceof Object
      ? value instanceof Array
        ? [...value].sort()
        : Object.keys(value)
            .sort()
            .reduce((sorted/*: Record<string, any>*/, key) => {
              sorted[key] = value[key];
              return sorted;
            }, {})
      : value;
  return JSON.stringify(data, replacer);
}

// path
/*export type PathParts = {
  origin?: string;
  pathname?: string;
  query?: string | Record<string, string>;
  hash?: string;
}*/;
/** Make path `${origin}${pathname}?${queryString}#{hash}` and normalize to no trailing `"/"` */
function makePath(parts/*: string | PathParts*/)/*: string*/ {
  if (is_string(parts)) {return parts}
  let origin = parts.origin ?? window.location.origin;
  let pathname = parts.pathname ?? window.location.pathname;
  let query = parts.query ?? window.location.search;
  let hash = parts.hash ?? window.location.hash;
  // build path
  let pathLocation = (origin ?? "") + (pathname ?? "");
  if (pathLocation.endsWith("/index.html")) pathLocation = pathLocation.slice(0, -10);
  pathLocation = pathLocation.replace(/(\/*$)/g, "") || "/";
  let queryString = '';
  if (is_string(query)) {
    queryString = query;
  } else if (Object.keys(query ?? {}).length) {
    const queryObject = query /*as any*/;
    queryString = `?${Object.entries(queryObject).map(([k, v]) => `${k}=${v}`).join("&")}`;
  }
  let hashString = hash ?? "";
  if (hashString && !hashString.startsWith("#")) hashString = "#" + hashString;
  return pathLocation + queryString + hashString;
}

// search
/** return `patternMask` for bitap_search() */
function bitap_pattern_mask(pattern/*: string*/)/*: Record<string, number>*/ {
  if (pattern.length > 31) throw new Error("Pattern too long! Bitap supports patterns up to 31 characters.");
  const patternMask/*: Record<string, number>*/ = {};
  for (let i = 0; i < pattern.length; i++) {
    patternMask[pattern[i]] = (patternMask[pattern[i]] || ~0) & ~(1 << i);
  }
  return patternMask;
}
/** Usage:
 * ```ts
 * const patternMask = bitap_pattern_mask(pattern);
 * bitap_search(text1, pattern.length, patternMask);
 * bitap_search(text2, pattern.length, patternMask);
 * ```
 *
 * return `[index_of_pattern_in_text, number_of_edits]` (up to 1 add/replace/delete), return `[-1, -1]` if not found */
function bitap_search(text/*: string*/, patternLength/*: number*/, patternMask/*: Record<string, number>*/)/*: [number, number]*/ {
  if (patternLength === 0) return [0, 0];

  let R_0 = ~1;
  let R_1 = ~1;
  let best_match_i = -1;
  for (let i = 0; i < text.length; i++) {
    let oldPrevR = R_0;
    R_0 |= (patternMask[text[i]] || ~0);
    R_0 <<= 1;

    /* allow 1 edit */
    //tmp = R_1
    const match = (R_1 | (patternMask[text[i]] || ~0));
    const replace = oldPrevR;
    const add_or_delete = oldPrevR << 1;
    R_1 = match & replace & add_or_delete;
    R_1 <<= 1;
    //oldPrevR = tmp;

    if ((R_0 & (1 << patternLength)) === 0) {
      return [i, 0];
    } else if ((R_1 & (1 << patternLength)) === 0) {
      best_match_i = i;
    }
  }

  return best_match_i == -1 ? [-1, -1] : [best_match_i, 1];
}
function search_options(pattern/*: string*/, options/*: string[]*/)/*: string[]*/ {
  if (pattern.length === 0) return options;
  const patternMask = bitap_pattern_mask(pattern);

  /*type SearchInfo = {
    option: string;
    index: number;
    editCount: number;
  }*/;
  const infos/*: SearchInfo[]*/ = [];
  for (let option of options) {
    let index, editCount = 0;
    if (pattern.length > 31) {
      index = option.indexOf(pattern);
    } else {
      [index, editCount] = bitap_search(option, pattern.length, patternMask);
    }
    if (index !== -1) {
      infos.push({option, index, editCount});
    }
  }

  return sortByArray(infos, v => [v.editCount, v.index]).map(v => v.option);
}
/*export type TableColumn = {
  label: string;
  render: ComponentFunction<[data: {row: any, rowIndex: number, column: TableColumn, columnIndex: number}]>;
  minWidth?: string | number;
  maxWidth?: string | number;
  flex?: string | number;
}*/;
/*export type TableProps = {
  label?: string;
  columns: TableColumn[];
  rows: any[];
  isLoading?: boolean;
  minHeight?: number;
  useMaxHeight?: boolean;
} & BaseProps*/;
export const table = makeComponent(function table(props/*: TableProps & BaseProps*/) {
  // TODO: actions, filters, search, paging, selection
  // TODO: make gray fully opaque?
  const {label, columns = [], rows = [], isLoading = false, minHeight = 400, useMaxHeight = false} = props;
  const tableWrapper = this.append(div({
    attribute: {useMaxHeight, isLoading},
    style: {minHeight},
  }));
  const makeRow = (className/*: string*/, key/*: string*/) => div({className, key});
  const makeCell = (column/*: TableColumn*/) => div({
    className: "table-cell",
    style: {flex: String(column.flex ?? 1), minWidth: column.minWidth, maxWidth: column.maxWidth},
  });
  if (label) {
    tableWrapper.append(span(label, {className: "table-label"}));
  }
  if (isLoading) {
    tableWrapper.append(loadingSpinner());
  } else {
    const headerWrapper = tableWrapper.append(makeRow("table-row table-header", "header"));
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
      const column = columns[columnIndex];
      const cellWrapper = headerWrapper.append(makeCell(column));
      cellWrapper.append(span(column.label));
    }
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      let row = rows[rowIndex];
      const rowWrapper = tableWrapper.append(makeRow("table-row table-body", `row-${rowIndex}`));
      for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
        let column = columns[columnIndex];
        const cellWrapper = rowWrapper.append(makeCell(column));
        cellWrapper.append(column.render({row, rowIndex, column, columnIndex}));
      }
    }
  }
});
/*export type DocsSection = {
  id: string;
  label: string;
  pages: DocsPage[];
}
*//*export type DocsPage = {
  id: string;
  label: string;
  component: ComponentFunction<[]>;
}
*/function getSizeLabel(size/*: string*/) {
  return size[0].toUpperCase() + size.slice(1);
}
export const GITHUB_PAGES_PREFIX = "/jsgui";
function getGithubPagesPrefix()/*: string*/ {
  const githubPrefix = "/jsgui";
  return window.location.pathname.startsWith(githubPrefix) ? githubPrefix : "";
}
function binary_search_float(start/*: number*/, end/*: number*/, condition/*: (value: number) => boolean*/)/*: number | null*/ {
  // find some endpoint, such that `condition(endpoint) == true`
  for (let i = 0; i < 1000; i++) { // runs in <100 steps
    let new_end = end + (start - end)*noise(i);
    if (condition(new_end)) {
      end = new_end;
      break;
    }
  }
  if (!condition(end)) return null;
  // NOTE: `condition` must be monotonic here
  while (true) {
    let midpoint = end + (start - end)*0.5;
    if (midpoint === start || midpoint === end) break;
    if (condition(midpoint)) {
      end = midpoint;
    } else {
      start = midpoint;
    }
  }
  if (condition(start)) {
    return start;
  } else if (condition(end)) {
    return end;
  } else {
    return null;
  }
}


/**
 * solve linear system(s) `MX = Y` in-place
 * @param M left square submatrix
 * @param Y any column after M
 * @returns `X`
 * */
function solveLinearSystem(rows/*: number[][]*/) {
  const width = rows[0].length;
  const height = rows.length;
  const normalizeRow = (x/*: number*/, y/*: number*/) => {
    const m = 1 / rows[y][x];
    for (let k = 0; k < width; k++) {
        rows[y][k] *= m;
    }
  }
  const subtractRow = (x/*: number*/, y/*: number*/) => {
      const m = rows[y][x]; // NOTE: source is always 1
      for(let k = 0; k < width; k++) {
          rows[y][k] -= rows[x][k] * m; // NOTE: source is always at (x, x)
      }
  }
  for (let i = 0; i < height; i++) {
    // prevent zeros
    if (rows[i][i] === 0) {
        const nonZeroRow = rows.findIndex(v => v[i] !== 0.0);
        if (nonZeroRow === -1) throw `Invalid linear system: ${rows}`;
        for (let k = 0; k < width; k++) {rows[i][k] += rows[nonZeroRow][k]}
    }
    // normalize
    normalizeRow(i, i);
    // subtract below
    for (let j = i+1; j < height; j++) {
        subtractRow(i, j);
    }
  }
  for (let i = height - 1; i >= 0; i--) {
    // subtract above
    for (let j = i-1; j >= 0; j--) {
        subtractRow(i, j);
    }
  }
  return rows.map(row => row[row.length - 1]);
}
const PHI_INV = (Math.sqrt(5) - 1) / 2;
/*export type GoldenSectionSearchOptions = {
  f: (x: number) => number;
  range: [number, number];
  findMaximum: boolean;
}*/;
function goldenSectionSearch(options/*: GoldenSectionSearchOptions*/) {
    const {f, range, findMaximum} = options;
    let [a, b] = range;
    if (findMaximum) {
        while (true) {
            let c = b - (b - a) * PHI_INV;
            let d = a + (b - a) * PHI_INV;
            if (c === a) return a;
            if (f(c) >= f(d)) {
                b = d;
            } else {
                a = c;
            }
        }
    } else {
        while (true) {
            let c = b - (b - a) * PHI_INV;
            let d = a + (b - a) * PHI_INV;
            if (c === a) return a;
            if (f(c) <= f(d)) {
                b = d;
            } else {
                a = c;
            }
        }
    }
    return a;
}
/*goldenSectionSearch({
    f: v => Math.cos(v),
    range: [0, Math.PI/4],
    findMaximum: true,
})*/
/*export type MinimaxOptions = {
  reference: (x: number) => number;
  range: [number, number];
  /** approximation(x) = sum(params.map(x)) *//*
  params: ((x: number) => number)[];
  matchEnds?: boolean;
}*/;
function minimax(options/*: MinimaxOptions*/) {
  const {reference, range, params, matchEnds = true} = options;
  const nodeCount = params.length + 1;
  let nodes = makeArray(nodeCount, (_, i) => {
    const t = matchEnds ? i / (nodeCount - 1) : (i + 1) / (nodeCount + 1);
    return lerp(t, range[0], range[1])
  });
  let coefficients/*: number[]*/ = [];
  let maxSolveError = 0;
  let pastErrors = Array(20).fill(Infinity);
  for (let iteration = 0; iteration < 300; iteration++) {
    // solve
    const matrixToSolve = nodes.map((node, i) => {
        let errorCoefficient = (-1)**i;
        if (matchEnds && (i === 0 || (i === nodes.length - 1))) {
            errorCoefficient = 0;
        }
        return [...params.map(param => param(node)), errorCoefficient, reference(node)]
    });
    let solve = solveLinearSystem(matrixToSolve);
    coefficients = solve.slice(0, -1);
    maxSolveError = solve[params.length];
    if (pastErrors.includes(maxSolveError)) break; // NOTE: we accumulate rounding errors while solving, so we would otherwise never converge when (matchEnds == true)
    pastErrors[iteration % pastErrors.length] = maxSolveError;
    //console.log(JSON.stringify({iteration, nodes, coefficients, maxSolveError}))
    // exchange nodes with extremum
    let extremum = {i: -1, x: 0, absError: 0};
    const f = (x/*: number*/) => params.reduce((acc, param, i) => acc + coefficients[i] * param(x), 0);
    const error = (x/*: number*/) => f(x) - reference(x);
    const extremumSearchStart = matchEnds ? 1 : 0;
    const extremumSearchEnd = matchEnds ? nodes.length - 1 : nodes.length;
    for (let i = extremumSearchStart; i < extremumSearchEnd; i++) {
      const left = i === 0 ? range[0] : nodes[i-1];
      const right = i === nodes.length - 1 ? range[1] : nodes[i+1];
      let findMaximum = i % 2 === 0;
      if (matchEnds) findMaximum = !findMaximum;
      const x = goldenSectionSearch({
        f: error,
        range: [left, right],
        findMaximum,
      });
      //console.log({x, left, right, findMaximum})
      const absError = Math.abs(error(x));
      if (absError >= extremum.absError) {
        extremum = {i, x, absError}
      }
    }
    //console.log(JSON.stringify({extremum}))
    if (nodes[extremum.i] === extremum.x) {break}
    nodes[extremum.i] = extremum.x;
  }
  return {coefficients, maxError: maxSolveError};
}
/*minimax({
  reference: v => Math.cos(v),
  range: [0, Math.PI/4],
  params: [() => 1, (v) => v*v, (v) => v*v*v*v],
  matchEnds: true,
})*/ // {"coefficients": [1, -0.49974056901418235, 0.040398729230590104], "maxError": 0.000015342201404119158}
export const htmlPage = makeComponent(function htmlPage() {
    let row = this.append(div({className: "display-row"}));
    row.append(span("span"));

    row.append(input({
      style: {height: 'var(--size-normal)'}, // TODO: make size a baseProp?
      attribute: {placeholder: "input"}},
    ));

    row.append(textarea({
      attribute: {placeholder: "textarea"}},
    ));

    const someButton = row.append(button("button", {
      style: {height: 'var(--size-normal)', fontSize: "14px"},
    }));
    someButton.append(svg(`
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" />
      </svg>`, {style: {width: "1em", height: "1em"}}));

    row.append(img(
      "/jsgui/assets/test_image.bmp",
      {style: {width: 24}, attribute: {title: "img"}}
    ));

    row.append(audio(
      "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3",
      {attribute: {controls: true, title: "audio"}}
    ));

    this.append(video([
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
    ], {style: {height: 240}, attribute: {controls: true, title: "video"}}));
});
export const spanPage = makeComponent(function spanPage() {
  for (let href of [undefined]) {
    let row = this.append(div({className: "display-row", style: {marginBottom: href ? 4 : 0}}))
    row.append(span("Small", {size: Size.small, href}));
    row.append(span("Normal", {size: Size.normal, href}));
    row.append(span("Big", {size: Size.big, href}));
    row.append(span("Bigger", {size: Size.bigger, href}));
  }

  for (let baseColor of Object.keys(BASE_COLORS)) {
    let row = this.append(div({className: "display-row"}))
    for (let shade = 0; shade < COLOR_SHADE_COUNT; shade++) {
      const color = `${baseColor}-${shade}`;
      row.append(span(color, {color}));
    }
  }
});
export const anchorPage = makeComponent(function anchorPage() {
  for (let href of ["https://www.google.com"]) {
    let row = this.append(div({className: "display-row", style: {marginBottom: href ? 4 : 0}}))
    row.append(span("Small", {size: Size.small, href}));
    row.append(span("Normal", {size: Size.normal, href}));
    row.append(span("Big", {size: Size.big, href}));
    row.append(span("Bigger", {size: Size.bigger, href}));
    row.append(span("Open in new tab", {size: Size.small, href, navType: NavType.OpenInNewTab}));
  }

  for (let href of ["assets/test_image.bmp"]) {
    let row = this.append(div({className: "display-row", style: {marginBottom: href ? 4 : 0}}))
    row.append(span("Download image", {size: Size.small, href, download: "test_image.bmp"}));
    row.append(span("Open in new tab", {size: Size.small, href, navType: NavType.OpenInNewTab}));
  }
});
export const buttonPage = makeComponent(function buttonPage() {
  let row = this.append(div({className: "display-row"}));
  for (let size of Object.values(Size)) row.append(coloredButton(getSizeLabel(size), {size}));

  row = this.append(div({className: "display-row", style: {marginTop: 4}}));
  for (let size of Object.values(Size)) row.append(coloredButton(getSizeLabel(size), {color: "secondary", size}));

  row = this.append(div({className: "display-row", style: {marginTop: 4}}));
  for (let size of Object.values(Size)) row.append(coloredButton("Disabled", {disabled: true, size}));
});
export const iconPage = makeComponent(function iconPage() {
  let row = this.append(div({className: "display-row"}));
  row.append(span("Static icon font from:"))
  row.append(span("https://fonts.google.com/icons", {href: "https://fonts.google.com/icons"}));

  row = this.append(div({className: "display-row"}));
  for (let size of Object.values(Size)) {
    row.append(icon("link", {size}));
  }

  row = this.append(div({className: "display-row"}));
  for (let size of Object.values(Size)) {
    const buttonWrapper = row.append(coloredButton("", {size, color: "secondary"}));
    buttonWrapper.append(icon("add", {size}));
    buttonWrapper.append(span(getSizeLabel(size)));
  }
  // TODO: circle buttons
});
/*type CodeFormatterProps = {
  text: string;
  getTokens: (text: string) => Component[];
}*/;
const codeFormatter = makeComponent(function codeFormatter(props/*: CodeFormatterProps*/) {
  const {text, getTokens} = props;
  const wrapper = this.append(code(""));
  for (let token of getTokens(text)) {
    wrapper.append(token);
  }
});

// js formatter
const JSTokenType = {
  Whitespace: 0,
  Newline: 1,
  Number: 2,
  Symbols: 3,
  SymbolCurlyRight: 4,
  SingleLineComment: 5,
  MultiLineComment: 6,
  String: 7,
  InterpolatedString: 8,
  Alphanumeric: 9,
  Keyword: 10,
  Boolean: 11, // "false" | "true"
}
const JS_TOKEN_TYPE_TO_GROUP/*: Record<JSTokenType, string>*/ = {
  [JSTokenType.Whitespace]: "whitespace",
  [JSTokenType.Newline]: "newline",
  [JSTokenType.Number]: "number",
  [JSTokenType.Symbols]: "symbols",
  [JSTokenType.SymbolCurlyRight]: "symbol-curly-right",
  [JSTokenType.SingleLineComment]: "single-line-comment",
  [JSTokenType.MultiLineComment]: "multi-line-comment",
  [JSTokenType.String]: "string",
  [JSTokenType.InterpolatedString]: "interpolated-string",
  [JSTokenType.Alphanumeric]: "alphanumeric",
  [JSTokenType.Keyword]: "keyword",
  [JSTokenType.Boolean]: "boolean",
};
function jsGetTokenType(text/*: string*/, i/*: number*/)/*: JSTokenType*/ {
  switch (text[i]) {
    case " ":
    case "\t":
      return JSTokenType.Whitespace;
    case "\r":
    case "\n":
      return JSTokenType.Newline;
    case "\"":
    case "'":
      return JSTokenType.String;
    case "`":
      return JSTokenType.InterpolatedString;
    case "0":
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
    case "7":
    case "8":
    case "9":
      return JSTokenType.Number;
    case "~":
    case "+":
    case "-":
    case "*":
    case "|":
    case "&":
    case ",":
    case "<":
    case ">":
    case "=":
    case "(":
    case ")":
    case "[":
    case "]":
    case "{":
    case "?":
    case ";":
      return JSTokenType.Symbols;
    case "}":
      return JSTokenType.SymbolCurlyRight;
    case "/":
      {
        const is_single_line_comment = text[i + 1] === "/";
        const is_multi_line_comment = text[i + 1] === "*";
        if (is_single_line_comment) return JSTokenType.SingleLineComment;
        return is_multi_line_comment ? JSTokenType.MultiLineComment : JSTokenType.Symbols;
      }
    default:
      return JSTokenType.Alphanumeric;
  }
}
function jsGetTokens(text/*: string*/)/*: Component[]*/ {
  let tokens/*: Component[]*/ = [];
  /*type Context = {
    continue_as: JSTokenType | null,
    interpolated_string_depth: number;
  }*/;
  const context/*: Context*/ = {
    continue_as: null,
    interpolated_string_depth: 0,
  };
  let j = 0;
  for (let i = j; i < text.length; i = j) {
    let startTokenType = jsGetTokenType(text, i);
    j = i + 1;
    let isNewline = startTokenType === JSTokenType.Newline;
    if (isNewline) {
      if (text[i] === "\r" && text[j] === "\n") {
        j += 1;
      }
      tokens.push(br({
        attribute: {"data-token-group": JS_TOKEN_TYPE_TO_GROUP[startTokenType]},
      }));
      continue;
    }
    startTokenType = context.continue_as ?? startTokenType;
    switch (startTokenType) {
      case JSTokenType.String:
        for (; j < text.length && (jsGetTokenType(text, j) !== JSTokenType.String);) {
          if (text[j] === "\\") j += 2;
          else j += 1;
        }
        j += 1;
        break;
      case JSTokenType.SymbolCurlyRight:
        if (context.interpolated_string_depth > 0) {
          context.interpolated_string_depth -= 1;
          context.continue_as = null;
          startTokenType = JSTokenType.InterpolatedString;
          // fallthrough to .InterpolatedString
        } else {
          break;
        }
      case JSTokenType.InterpolatedString:
        for (; j < text.length; j++) {
          const tokenType = jsGetTokenType(text, j);
          if (tokenType === JSTokenType.InterpolatedString) {
            j += 1;
            context.continue_as = null;
            break;
          };
          if (tokenType === JSTokenType.Newline) {
            context.continue_as = JSTokenType.InterpolatedString;
            break;
          }
          if (text.slice(j-2, j) === "${") {
            context.interpolated_string_depth += 1;
            break
          };
        }
        break;
      case JSTokenType.SingleLineComment:
        for (; j < text.length && jsGetTokenType(text, j) !== JSTokenType.Newline; j++) {}
        break;
      case JSTokenType.MultiLineComment:
        for (; j < text.length; j++) {
          if (text[j-1] === "*" && text[j] === "/") {
            context.continue_as = null;
            j++;
            break;
          }
          if (jsGetTokenType(text, j) === JSTokenType.Newline) {
            context.continue_as = JSTokenType.MultiLineComment;
            break
          }
        }
        break;
      case JSTokenType.Alphanumeric:
        for (; j < text.length; j++) {
          const tokenType = jsGetTokenType(text, j);
          if (tokenType !== JSTokenType.Alphanumeric && tokenType !== JSTokenType.Number) {
            break;
          }
        }
        break;
      case JSTokenType.Symbols:
        if (text[i] === '+' || text[i] === '-' && jsGetTokenType(text, j) === JSTokenType.Number) {
          startTokenType = JSTokenType.Number;
          // fallthrough to .Number
        } else {
          break;
        }
      case JSTokenType.Number:
        {
          let is_first_dot = true;
          for (; j < text.length; j++) {
            if (text[j] === '.') {
              if (is_first_dot) {
                is_first_dot = false;
                continue;
              } else {
                break;
              }
            }
            if (jsGetTokenType(text, j) !== JSTokenType.Number) break;
          }
          break;
        }
      default:
        for (; j < text.length && jsGetTokenType(text, j) === startTokenType; j++) {}
        break;
    }
    const token = text.slice(i, j);
    switch (token) {
    case "const":
    case "let":
    case "var":
    case "for":
    case "in":
    case "of":
    case "switch":
    case "function":
    case "new":
    case "delete":
      startTokenType = JSTokenType.Keyword;
      break;
    case "true":
    case "false":
      startTokenType = JSTokenType.Boolean;
      break;
    }
    tokens.push(span(token, {
      attribute: {"data-token-group": JS_TOKEN_TYPE_TO_GROUP[startTokenType]},
    }));
    if (j === i) {
      console.error("Failed to parse", {text, i, j});
      break
    }
  }
  return tokens;
}
export const jsFormatter = makeComponent(function javascriptFormatter(text/*: string*/, props/*?: BaseProps*/) {
  this.append(codeFormatter({
    text,
    getTokens: jsGetTokens,
    ...props,
  }));
});
function oklch_to_srgb255(oklch/*: vec3*/)/*: vec3*/ {
  const oklab = _oklch_to_oklab(oklch);
  const linear_srgb = _oklab_to_linear_srgb(oklab);
  const srgb = _linear_srgb_to_srgb(linear_srgb);
  return _srgb_to_srgb255(srgb);
}
function oklch_to_srgb255i(oklch/*: vec3*/)/*: vec3*/ {
  return _srgb255_to_srgb255i(oklch_to_srgb255(oklch))
}

function _oklch_to_oklab(oklch/*: vec3*/)/*: vec3*/ {
  return vec3(oklch.x, oklch.y * Math.cos(oklch.z), oklch.y * Math.sin(oklch.z));
}
// oklab_to_linear_srgb() from https://bottosson.github.io/posts/oklab/
function _oklab_to_linear_srgb(c/*: vec3*/)/*: vec3*/ {
  let l_ = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  let m_ = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  let s_ = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;

  let l = l_*l_*l_;
  let m = m_*m_*m_;
  let s = s_*s_*s_;

  return vec3(
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  );
}
function _linear_srgb_to_srgb(linear_srgb/*: vec3*/)/*: vec3*/ {
  const srgb_companding = (v/*: number*/) => {
    return v <= 0.0031308 ? 12.92 * v : 1.055 * v**(1/2.4) - 0.055
  }
  return vec3(srgb_companding(linear_srgb.x), srgb_companding(linear_srgb.y), srgb_companding(linear_srgb.z))
}
function _srgb_to_srgb255(srgb/*: vec3*/)/*: vec3*/ {
  return vec3(srgb.x * 255.0, srgb.y * 255.0, srgb.z * 255.0);
}
function _srgb255_to_srgb255i(srgb255/*: vec3*/)/*: vec3*/ {
  return vec3(
    round_away_from_zero(srgb255.x),
    round_away_from_zero(srgb255.y),
    round_away_from_zero(srgb255.z),
  );
}
export const dialogPage = makeComponent(function dialogPage() {
    const [state, setState] = this.useState({dialogOpen: false});

    const row = this.append(div({className: "display-row", style: {marginTop: 2}}));
    row.append(coloredButton("Open dialog", {color: "secondary", onClick: () => setState({dialogOpen: true})}));

    const closeDialog = () => setState({dialogOpen: false});
    const dialogWrapper = row.append(dialog({open: state.dialogOpen, onClose: closeDialog, closeOnClickBackdrop: true}));
    dialogWrapper.append(span("Hello world"));
});
export const notFoundPage = makeComponent(function notFoundPage() {
  this.append(span("Page not found"));
});
export const mediaQueryPage = makeComponent(function mediaQueryPage() {
    const column = this.append(div({className: "display-column"}));
    const smOrBigger = this.useMedia({minWidth: 600});
    column.append(span(`smOrBigger: ${smOrBigger}`));

    const mdOrBigger = this.useMedia({minWidth: 900});
    column.append(span(`mdOrBigger: ${mdOrBigger}`));

    const lgOrBigger = this.useMedia({minWidth: 1200});
    column.append(span(`lgOrBigger: ${lgOrBigger}`));

    const xlOrBigger = this.useMedia({minWidth: 1500});
    column.append(span(`xlOrBigger: ${xlOrBigger}`));
});
export const debugKeysPage = makeComponent(function debugKeysPage() {
  const [state, setState] = this.useState({
    toggle: false,
  });
  this.append(button("Toggle", {events: {
    click: () => {
      setState({toggle: !state.toggle});
    }
  }}));
  if (state.toggle) {
    //this.append(span("wow"));
    this.append(span("wow", {key: undefined}));
    //this.append(span("wow", {key: null}));
    //this.append(span("wow", {key: ''}));
  }
});
export const popupPage = makeComponent(function popupPage() {
    for (let direction of ["up", "right", "down", "left", "mouse"] /*as PopupDirection[]*/) {
        const row = this.append(div({className: "wide-display-row"}));
        const leftPopup = row.append(popupWrapper({
            content: span("Tiny"),
            direction,
            interactable: direction !== "mouse",
        }));
        leftPopup.append(span(`direction: "${direction}"`));
        const rightPopup = row.append(popupWrapper({
            content: span("I can be too big to naively fit on the screen!"),
            direction,
            interactable: direction !== "mouse",
        }));
        rightPopup.append(span(`direction: "${direction}"`));
    }

    const [state, setState] = this.useState({buttonPopupOpen: false});

    const row = this.append(div({className: "wide-display-row"}));
    const popup = row.append(popupWrapper({
        content: span("Tiny"),
        direction: "down",
        open: state.buttonPopupOpen,
        interactable: true,
    }));

    popup.append(coloredButton(`Toggle popup`, {
        onClick: () => {
            setState({buttonPopupOpen: !state.buttonPopupOpen});
        },
    }));
});
export const textInputPage = makeComponent(function textInputPage() {
  // username
  const [state, setState] = this.useState({username: ""});

  let row = this.append(div({className: "display-row"}));
  row.append(
    textInput({
      label: "Username",
      value: state.username,
      onInput: (event) => {
        setState({username: event.target.value});
      },
      //autoFocus: true,
    })
  );
  row.append(span("This input is stored in the component state."));

  row = this.append(div({className: "display-row"}));
  row.append(span(`state: ${JSON.stringify(state)}`));
});
function oklch_to_dot_pos(props/*: {inputMode: OKLCH_InputMode, oklch: vec3, chroma_max: number}*/) {
  const {inputMode, oklch, chroma_max} = props;
  // TODO: checkbox or something for switching input_mode
  let dotPos/*: vec2*/;
  if (inputMode == 0) {
    dotPos = vec2(
      oklch.x * Math.cos(oklch.z),
      oklch.x * Math.sin(oklch.z),
    );
  } else {
    dotPos = vec2(
      oklch.y / chroma_max * Math.cos(oklch.z),
      oklch.y / chroma_max * Math.sin(oklch.z),
    );
  }
  const dotOffset = vec2(
    (dotPos.x + 1) * 0.5,
    (1 - dotPos.y) * 0.5
  );
  return {dotPos, dotOffset};
}
function dot_pos_to_oklch(props/*: {inputMode: OKLCH_InputMode, slider: number, dotOffset: vec2, chroma_max: number}*/) {
  const {inputMode, dotOffset, slider, chroma_max} = props;
  const dotPos = vec2(
    dotOffset.x * 2 - 1,
    1 - dotOffset.y * 2,
  );
  const distance = vec2_circle_norm(dotPos);
  let L/*: number*/, C/*: number*/;
  if (inputMode === 0) {
    L = distance;
    C = slider;
  } else {
    L = slider;
    C = distance * chroma_max;
  }
  const H = Math.atan2(dotPos.y, dotPos.x);
  return vec3(L, C, H);
}

export const OKLCH_InputMode = {
  LH_C: 0,
  CH_L: 1,
}
/*type OKLCHInputProps = BaseProps & {
  defaultValue?: vec3;
  inputMode?: OKLCH_InputMode
  onChange?: (newValue: vec3 | null) => void;
}*/;
export const oklchInput = makeComponent(function oklchInput(props/*: OKLCHInputProps*/) {
  const {defaultValue = vec3(0.50, 0.10, 0.4), inputMode = OKLCH_InputMode.CH_L, onChange} = props;

  const BACKGROUND_COLOR = [0.4, 0.4, 0.4] /*as [number, number, number]*/;
  const chroma_max = inputMode === 0 ? 0.127 : 0.3171;

  /*type OKLCHState = {
    /** input dot position *//*
    dotOffset: vec2;
    /** input slider *//*
    slider: number;
    /** clamped output *//*
    _clamped_oklch: vec3;
  }
 */ const [state, setState] = this.useState/*<OKLCHState>*/((diff, prevState) => {
    let newState = {...prevState, ...diff} /*as OKLCHState*/;
    // default values
    if (prevState === undefined) {
      const defaultDotPos = oklch_to_dot_pos({
        inputMode,
        oklch: defaultValue,
        chroma_max: chroma_max,
      });
      newState = {
        dotOffset: defaultDotPos.dotOffset,
        slider: inputMode === 0 ? defaultValue.y : defaultValue.x,
        _clamped_oklch: defaultValue,
      };
    }
    // clamp to nearest valid oklch
    let {dotOffset, slider} = newState;
    let oklch = dot_pos_to_oklch({
      inputMode,
      dotOffset,
      slider,
      chroma_max,
    });
    let L/*: number | null*/ = oklch.x;
    let C/*: number | null*/ = oklch.y;
    const H = oklch.z;

    if (inputMode === 0) {
      const get_srgb255 = (lightness/*: number*/) => {
        return oklch_to_srgb255(vec3(lightness, C /*as number*/, H));
      }
      const is_valid_srgb255 = (lightness/*: number*/) => {
        const srgb255 = get_srgb255(lightness);
        return vec3_min_component(srgb255) >= 0.0 && vec3_max_component(srgb255) <= 255.0;
      }
      const srgb255 = get_srgb255(L);
      if (vec3_min_component(srgb255) < 0.0) {
        const new_L = binary_search_float(L, 1, is_valid_srgb255);
        //console.log('L too low', {L, new_L, 'get_srgb255(new_L)': new_L != null && get_srgb255(new_L)});
        L = new_L;
      } else if (vec3_max_component(srgb255) > 255.0) {
        const new_L = binary_search_float(Math.min(L, 1), 0, is_valid_srgb255);
        //console.log('L too high', {L, new_L, 'get_srgb255(new_L)': new_L != null && get_srgb255(new_L)});
        L = new_L;
      }
    } else {
      const get_srgb255 = (chroma/*: number*/) => {
        return oklch_to_srgb255(vec3(L /*as number*/, chroma, H));
      }
      const is_valid_srgb255 = (chroma/*: number*/) => {
        const srgb255 = get_srgb255(chroma);
        return vec3_min_component(srgb255) >= 0.0 && vec3_max_component(srgb255) <= 255.0;
      }
      if (!is_valid_srgb255(C)) {
        C = binary_search_float(Math.min(C, chroma_max), 0, is_valid_srgb255);
      }
    }

    if (L != null && C != null) {
      const _clamped_oklch = vec3(L, C, H);
      newState._clamped_oklch = _clamped_oklch;
      setTimeout(() => {
        if (onChange) onChange(_clamped_oklch);
      });
    }
    return newState;
  });

  // LH circle input
  const wrapper = this.append(div());
  const updateDotPos = (_event/*: PointerEvent*/, pointerPos/*: UseOnPointerMoveValue*/) => {
    const {fractionX, fractionY} = pointerPos;
    const dotOffset = vec2(clamp(fractionX, 0, 1), clamp(fractionY, 0, 1));
    setState({dotOffset});
  }
  const {onPointerDown: LHCircleOnPointerDown} = useOnPointerMove({
    onPointerDown: updateDotPos,
    onPointerMove: updateDotPos,
  });
  const circleInputWrapper = wrapper.append(div({className: "color-circle-wrapper"}));
  const {data: oklchInput_fragmentShader} = useCachedRequest({
    component: this,
    url: '/jsgui/docs/components/inputs/oklch_input.frag',
    responseType: 'text',
  });
  if (oklchInput_fragmentShader == null) {
    circleInputWrapper.append(div({style: {width: '100%', height: '100%', background: `rgb(${BACKGROUND_COLOR.map(v => 255*v)})`}}));
  } else {
    circleInputWrapper.append(webgl({
      events: {
        pointerdown: LHCircleOnPointerDown,
      },
      programs: {
        colorWheel: {
          vertex: `
            in vec2 v_position;
            void main() {
              gl_Position = vec4(v_position, 0, 1);
            }
          `,
          fragment: oklchInput_fragmentShader,
        }
      },
      renderResolutionMultiplier: 4,
      render: ({gl, programs: {colorWheel}, rect}) => {
        glUseProgram(gl, colorWheel);
        gl.uniform2f(colorWheel.u_viewport, rect.width, rect.height);
        gl.uniform3f(colorWheel.u_background_color, ...BACKGROUND_COLOR);
        gl.uniform1i(colorWheel.u_input_mode, inputMode);
        gl.uniform1f(colorWheel.u_slider, state.slider);
        gl.uniform1f(colorWheel.u_chroma_max, chroma_max);
        glSetBuffer(gl, colorWheel.v_position, new Float32Array([
          -1, -1,
          +1, -1,
          +1, +1,
          -1, +1,
        ]));
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
      }
    }));
  }
  circleInputWrapper.append(div({
    className: "color-circle-dot",
    style: {left: addPercent(state.dotOffset.x), top: addPercent(state.dotOffset.y)}
  }));

  // main slider input (C or L)
  let srgb255 = oklch_to_srgb255i(state._clamped_oklch);

  const main_sliderWrapper = wrapper.append(div({className: "color-slider-wrapper"}));
  main_sliderWrapper.append(span(inputMode === 0 ? "C:" : "L:", {className: "color-slider-wrapper-label"}));
  main_sliderWrapper.append(sliderInput({
    className: "color-slider",
    cssVars: {
      sliderBackground: `rgb(${srgb255.x}, ${srgb255.y}, ${srgb255.z})`,
      sliderKnobBackground: "rgb(175, 255, 255)",
    },
    range: inputMode === 0 ? [0, chroma_max] : [0, 1],
    decimalPlaces: 3,
    value: state.slider,
    onInput: (event) => {
      setState({
        slider: event.target.value,
      });
    }
  }));

  // H input
  const H_sliderWrapper = wrapper.append(div({className: "color-slider-wrapper"}));
  H_sliderWrapper.append(span("H:", {className: "color-slider-wrapper-label"}));
  H_sliderWrapper.append(sliderInput({
    className: "color-slider",
    cssVars: {
      sliderBackground: `rgb(${srgb255.x}, ${srgb255.y}, ${srgb255.z})`,
      sliderKnobBackground: "rgb(175, 255, 255)",
    },
    range: [0, 2*Math.PI],
    decimalPlaces: 3,
    value: mod(state._clamped_oklch.z, 2*Math.PI),
    onInput: (event) => {
      const oklch = dot_pos_to_oklch({
        inputMode,
        dotOffset: state.dotOffset,
        slider: state.slider,
        chroma_max,
      });
      oklch.z = event.target.value;
      const dotOffset = oklch_to_dot_pos({inputMode, oklch, chroma_max}).dotOffset;
      setState({dotOffset});
    }
  }));

  // hex string
  wrapper.append(span("#" + [srgb255.x, srgb255.y, srgb255.z].map(v => v.toString(16).padStart(2, "0")).join(""), {style: {marginLeft: 4}}))
});
export const numberInputsPage = makeComponent(function numberInputsPage() {
  // count
  const [count, setCount] = this.useLocalStorage("count", 0 /*as number | null*/);

  let row = this.append(div({className: "display-row"}));
  row.append(
    numberInput({
      label: "Count",
      value: count,
      onInput: (event) => {
        const newCount = event.target.value;
        setCount(newCount === "" ? null : +newCount);
      },
      min: 0,
      clearable: false,
    })
  );
  row.append(span("This input is stored in local storage (synced across tabs and components)."));

  row = this.append(div({className: "display-row"}));
  row.append(span(`count: ${count}`));

  row = this.append(div({className: "display-row"}));
  row.append(sliderInput({
    range: [0, 100],
    value: count,
    onInput: (event) => {
      setCount(event.target.value);
    },
  }));
})
export const webgpuPage = makeComponent(function webgpuPage() {
  this.append(webgpu({
    style: {width: 150, height: 150},
    shaderCode: `
      struct VertexOut {
        @builtin(position) position : vec4f,
        @location(0) color : vec4f
      }

      @vertex
      fn vertex_main(
        @location(0) position: vec4f,
        @location(1) color: vec4f
      ) -> VertexOut {
        var output : VertexOut;
        output.position = position;
        output.color = color;
        return output;
      }

      @fragment
      fn fragment_main(fragData: VertexOut) -> @location(0) vec4f {
        return fragData.color;
      }
    `,
    init: ({gpu, device, shaderModule}) => {
      // NOTE: copy paste from MDN
      // Vertex data for triangle
      // Each vertex has 8 values representing position and color: X Y Z W R G B A
      const vertices = new Float32Array([
        0.0,  0.6, 0, 1, 1, 0, 0, 1,
       -0.5, -0.6, 0, 1, 0, 1, 0, 1,
        0.5, -0.6, 0, 1, 0, 0, 1, 1
      ]);

      const vertexBuffer = device.createBuffer({
        size: vertices.byteLength, // make it big enough to store vertices in
        usage: window['GPUBufferUsage'].VERTEX | window['GPUBufferUsage'].COPY_DST,
      });

      // Copy the vertex data over to the GPUBuffer using the writeBuffer() utility function
      device.queue.writeBuffer(vertexBuffer, 0, vertices, 0, vertices.length);

      // 5: Create a GPUVertexBufferLayout and GPURenderPipelineDescriptor to provide a definition of our render pipline
      const vertexBuffers = [{
        attributes: [{
          shaderLocation: 0, // position
          offset: 0,
          format: 'float32x4'
        }, {
          shaderLocation: 1, // color
          offset: 16,
          format: 'float32x4'
        }],
        arrayStride: 32,
        stepMode: 'vertex'
      }];

      const pipelineDescriptor = {
        vertex: {
          module: shaderModule,
          entryPoint: 'vertex_main',
          buffers: vertexBuffers
        },
        fragment: {
          module: shaderModule,
          entryPoint: 'fragment_main',
          targets: [{
            format: gpu.getPreferredCanvasFormat()
          }]
        },
        primitive: {
          topology: 'triangle-list'
        },
        layout: 'auto'
      };

      // 6: Create the actual render pipeline
      const renderPipeline = device.createRenderPipeline(pipelineDescriptor); // TODO: can we store the descriptors and pipeline?

      return {
        vertexBuffer,
        renderPipeline,
      };
    },
    render: ({context, device, data}) => {
      const {vertexBuffer, renderPipeline} = data;

      // swap buffers
      const renderPassDescriptor = {
        colorAttachments: [{
          clearValue: {r: 0.0, g: 0.5, b: 1.0, a: 1.0},
          loadOp: 'clear',
          storeOp: 'store',
          view: context.getCurrentTexture().createView(),
        }]
      };

      // create command buffer
      const commandEncoder = device.createCommandEncoder();

      // create a draw triangles command
      const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);
      renderPass.setPipeline(renderPipeline);
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.draw(3);
      renderPass.end();

      // submit commands
      device.queue.submit([commandEncoder.finish()]);
    }
  }))
});
export const webglPage = makeComponent(function webglPage() {
  this.append(webgl({
    style: {width: 150, height: 150},
    programs: {
      gradient: {
        vertex: `
          in vec2 v_position;
          in vec3 v_color;
          out vec3 f_color;
          void main() {
            gl_Position = vec4(v_position, 0, 1);
            f_color = v_color;
          }
        `,
        fragment: `
          in vec3 f_color;
          out vec4 out_color;
          void main() {
            out_color = vec4(f_color, 1);
          }
        `,
      },
      flatColor: {
        vertex: `
          in vec2 v_position;
          void main() {
            gl_Position = vec4(v_position, 0, 1);
          }
        `,
        fragment: `
          uniform mat4x4 u_mat;
          uniform vec3 u_color;
          out vec4 out_color;
          void main() {
            out_color = u_mat * vec4(u_color, 1);
          }
        `,
      },
    },
    render: ({gl, programs}) => {
      // draw square
      const flatColor = programs.flatColor;
      glUseProgram(gl, flatColor);
      glSetBuffer(gl, flatColor.v_position, new Float32Array([
        -1, -1,
        -1, +1,
        +1, +1,
        +1, -1,
      ]));
      gl.uniformMatrix4fv(flatColor.u_mat, false, [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
      ]);
      gl.uniform3f(flatColor.u_color, 0, 0.5, 1);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
      // draw triangle
      const gradient = programs.gradient;
      glUseProgram(gl, gradient);
      glSetBuffer(gl, gradient.v_position, new Float32Array([
        0.0,  0.6,
       -0.5, -0.6,
        0.5, -0.6,
      ]));
      glSetBuffer(gl, gradient.v_color, new Float32Array([
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
      ]));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }));
})
export const tabsPage = makeComponent(function tabsPage() {
    const [state, setState] = this.useState({selectedTab: 0 /*as string | number*/});

    // tabs
    const tabOptions/*: TabsOption[]*/ = [
        {label: "foo"},
        {label: "bar"},
        {id: "customId", label: "zoo"},
    ];
    this.append(tabs({
        options: tabOptions,
        selectedId: state.selectedTab,
        setSelectedId: (newId) => setState({selectedTab: newId}),
    }));

    // content
    const selectedTab = tabOptions.find((option, i) => (option.id ?? i) === state.selectedTab);
    if (selectedTab) {
        this.append(span(selectedTab.label, {key: state.selectedTab}))
    }
});
export const tablePage = makeComponent(function tablePage() {
    const [count, setCount] = this.useLocalStorage("count", 0 /*as number | null*/);
    this.append(
      numberInput({
        label: "Count",
        value: count,
        onInput: (event) => {
          const newCount = event.target.value;
          setCount(newCount === "" ? null : +newCount);
          this.rerender();
        },
        min: 0,
        clearable: false,
      })
    );
    const rows = Array(clamp(+(count ?? 0), 0, 100))
      .fill(0)
      .map((_, i) => i);
    this.append(
      table({
        label: "Stuff",
        rows,
        columns: [
          {
            label: "#",
            render: (props) => span(props.rowIndex + 1),
          },
          {
            label: "Name",
            render: (props) => span(`foo ${props.row}`),
          },
          {
            label: "Count",
            render: (props) => span(props.row),
          },
        ],
      })
    );
    if ((count ?? 0) % 2 === 0) {
      this.append(testKeysComponent({key: "testKeysComponent"}));
    }
  });
  const testKeysComponent = makeComponent(function testKeysComponent(_/*: BaseProps*/ = {}) {
    this.append(span(""));
  });
export const routerPage = makeComponent(function routerPage() {
  // someComponent
  /*type SomeComponentParams = {
    routerDemoId: string;
  }*/;
  const someComponent = makeComponent(function someComponent(routeParams/*: SomeComponentParams*/) {
    this.append(`routeParams: ${JSON.stringify(routeParams)}`);
    // location
    const location = this.useLocation();
    const locationDiv = this.append(div())
    locationDiv.append(`location: ${JSON.stringify(location)}`);
  });

  // default component
  const notFoundComponent = makeComponent(function notFoundComponent() {
    this.append("notFoundComponent");
  });

  // routes
  const DEMO_ROUTES/*: Route[]*/ = [
    {
      path: "/displays/router/:routerDemoId",
      component: someComponent,
      showInNavigation: true,
      defaultPath: "/displays/router/foo",
      label: "foo",
    },
    {
      path: "/displays/router/:routerDemoId",
      component: someComponent,
      showInNavigation: true,
      defaultPath: "/displays/router/foobar",
      label: "foobar",
    },
  ];

  // pageWrapperComponent
  const pageWrapperComponent = makeComponent(function pageWrapperComponent(props/*: PageWrapperProps*/) {
    const {routes, currentRoute, contentWrapperComponent, routeParams} = props;
    const navmenu = this.append(div({style: {display: "flex", gap: 8}}));
    for (let route of routes) {
      if (route.showInNavigation) {
        navmenu.append(span(route.label, {href: route.defaultPath ?? route.path}));
      }
    }
    const contentWrapper = this.append(contentWrapperComponent());
    contentWrapper.append(currentRoute.component(routeParams));
  });

  // router
  this.append(router({
    routes: DEMO_ROUTES,
    pageWrapperComponent: pageWrapperComponent,
    notFoundRoute: {
      component: notFoundComponent,
    },
  }));
  // TODO: document navigate() function
});
export const progressPage = makeComponent(function progressPage() {
    // loading spinner
    let row = this.append(div({className: "display-row"}));
    for (let size of Object.values(Size)) row.append(loadingSpinner({size, color: 'secondary-1'}));

    // linear progress indeterminate
    row = this.append(div({className: "wide-display-row", style: {marginBottom: 4, maxWidth: 900}}));
    row.append(progress({color: 'secondary-0'}));

    // linear progress determinate
    const [state, setState] = this.useState({progress: 0.0});
    row = this.append(div({className: "wide-display-row", style: {marginBottom: 4, maxWidth: 900}}));
    row.append(progress({fraction: state.progress, color: 'secondary-0'}));

    // button
    row = this.append(div({className: "display-row", style: {marginTop: 0}}));
    row.append(coloredButton("progress = (progress + 0.2) % 1.2", {
        color: "secondary",
        onClick: () => {
            setState({progress: (state.progress + 0.2) % 1.2});
        }
    }));
});
export const themeCreatorPage = makeComponent(function themeCreatorPage() {
  const wrapper = this.append(div());
  wrapper.append(oklchInput({
    defaultValue: vec3(0.7482, 0.127, -2.7041853071795865),
    inputMode: OKLCH_InputMode.LH_C,
    onChange: (oklch) => {
      const srgb255i = oklch != null && oklch_to_srgb255i(oklch);
      console.log('onchange', {
        oklch,
        srgb255i,
      });
    }
  }));
  wrapper.append(oklchInput({
    defaultValue: vec3(0.6939, 0.1614, 57.18 * Math.PI / 180),
    inputMode: OKLCH_InputMode.CH_L,
    onChange: (oklch) => {
      const srgb255i = oklch != null && oklch_to_srgb255i(oklch);
      console.log('onchange', {
        oklch,
        srgb255i,
      });
    }
  }));
});
export const DOCS_SECTIONS/*: DocsSection[]*/ = [
  {
    id: "basics",
    label: "Basics",
    pages: [
        {id: "html", label: "HTML", component: htmlPage},
        {id: "span", label: "Span", component: spanPage},
        {id: "anchor", label: "Anchor", component: anchorPage},
        {id: "button", label: "Button", component: buttonPage},
        {id: "icon", label: "Icon", component: iconPage},
    ],
  },
  {
    id: "displays",
    label: "Displays",
    pages: [
        {id: "router", label: "Router", component: routerPage},
        {id: "dialog", label: "Dialog", component: dialogPage},
        {id: "popup", label: "Popup", component: popupPage},
        {id: "progress", label: "Progress", component: progressPage},
        {id: "mediaQuery", label: "Media query", component: mediaQueryPage},
        {id: "table", label: "Table", component: tablePage},
        {id: "tabs", label: "Tabs", component: tabsPage},
        {id: "webgl", label: "WebGL", component: webglPage},
        {id: "webgpu", label: "WebGPU", component: webgpuPage},
    ],
  },
  {
    id: "inputs",
    label: "Inputs",
    pages: [
      {id: "textInput", label: "Text input", component: textInputPage},
      {id: "numberInputs", label: "Number inputs", component: numberInputsPage},
    ]
  },
];

/*type RouteParams = {
  sectionId: string,
  subsectionId: string,
  routerDemoId: string,
}*/;
export const docsPage = makeComponent(function docsPage(routeParams/*: RouteParams*/) {
  const [state, setState] = this.useState({
    sectionId: routeParams.sectionId ?? DOCS_SECTIONS[0].id,
    subsectionId: routeParams.subsectionId ?? DOCS_SECTIONS[0].pages[0].id,
  });
  // section
  const column = this.append(
    div({style: {display: "flex", flexDirection: "column", alignItems: "flex-start", rowGap: 8}})
  );
  const navigationColumn = column.append(div());
  navigationColumn.append(tabs({
    options: DOCS_SECTIONS,
    selectedId: state.sectionId,
    setSelectedId: (newId) => setState({sectionId: newId /*as string*/}),
  }));
  // subsection
  const selectedSection = DOCS_SECTIONS.find(v => v.id === state.sectionId);
  const getSelectedPage = () => selectedSection?.pages.find(v => v.id === state.subsectionId);
  if (selectedSection && getSelectedPage() == null) {
    state.subsectionId = selectedSection.pages[0].id;
  }
  navigationColumn.append(tabs({
    options: selectedSection?.pages ?? [],
    selectedId: state.subsectionId,
    setSelectedId: (newId) => setState({subsectionId: newId /*as string*/}),
    style: {marginTop: 4},
  }));
  // content
  const tabsContent = column.append(div({className: "display-column", style: {width: "100%", padding: "0 8px"}}));
  const selectedPageComponent = getSelectedPage()?.component();
  if (selectedPageComponent) {
    tabsContent.append(selectedPageComponent);
    const selectedOnRender = selectedPageComponent.onRender;
    const codeString = `const ${selectedOnRender?.name} = makeComponent(${selectedOnRender});`;
    column.append(jsFormatter(codeString));
  }
  // update url
  let wantPathname = `${getGithubPagesPrefix()}/${state.sectionId}/${state.subsectionId}`;
  if (routeParams.routerDemoId) {
    wantPathname += `/${routeParams.routerDemoId}`;
  }
  if (window.location.pathname !== wantPathname) {
    navigate({
      pathname: wantPathname,
      query: '',
      hash: '',
    }, NavType.Replace);
  }
});
export const ROUTES/*: Route[]*/ = [
  {
    path: `/`,
    component: docsPage,
    showInNavigation: true,
    wrapper: true,
    label: "Docs",
  },
  {
    path: `/:sectionId`,
    component: docsPage,
    wrapper: true,
    label: "Docs",
  },
  {
    path: `/:sectionId/:subsectionId`,
    component: docsPage,
    wrapper: true,
    label: "Docs",
  },
  {
    path: `/:sectionId/:subsectionId/:routerDemoId`,
    component: docsPage,
    wrapper: true,
    label: "Docs",
  },
  {
    path: `/themeCreator`,
    component: themeCreatorPage,
    showInNavigation: true,
    wrapper: true,
    label: "Theme creator",
  },
  {
    path: `/debugKeys`,
    component: debugKeysPage,
    wrapper: false,
    label: "Theme creator",
  },
];
export const root = makeComponent(function root() {
  this.append(
    router({
      prefix: GITHUB_PAGES_PREFIX,
      pageWrapperComponent: pageWrapper,
      routes: ROUTES,
      notFoundRoute: {
        component: () => notFoundPage(),
      },
    })
  );
});
export const pageWrapper = makeComponent(function pageWrapper(props/*: PageWrapperProps*/) {
  const {currentRoute, routeParams, contentWrapperComponent} = props;
  const wrapper = this.append(div({
    style: {
      height: "100%",
      display: "flex",
      alignItems: "stretch",
    },
  }));
  wrapper.append(icon("link", {style: {position: "absolute", color: 'rgba(0 0 0 / 0%)'}})) // preload icon font
  // TODO!: highlight routes
  const navigation = wrapper.append(div({
    className: "nav-menu", // TODO: styles
    style: {display: "flex", flexDirection: "column"},
  }));
  navigation.append(span(`version: ${JSGUI_VERSION}`, {size: Size.small}));
  ROUTES.forEach((route) => {
    if (route.showInNavigation) {
      navigation.append(span(route.label, { href: `${getGithubPagesPrefix()}${route.defaultPath ?? route.path}` }));
    }
  });
  const contentWrapper = wrapper.append(contentWrapperComponent())
  contentWrapper.append(currentRoute.component(routeParams));
})
renderRoot(root());
