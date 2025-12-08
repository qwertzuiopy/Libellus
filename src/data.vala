using Gee;

public class Libellus.Data {
    public Data (string data) {
        Value v = Value.parse (data);
        message (v.to_str());
    }
}

public class Value {
    public enum Kind {
        ARRAY,
        STRING,
        NUMBER,
        MAP,
    }
    public Kind kind;
    public double num;
    public string str;
    public ArrayList<Value> arr;
    public HashMap<string, Value> hashmap;
    public Value.string(string str) {
        this.str = str;
        this.kind = Kind.STRING;
    }
    public Value.number(double num) {
        this.num = num;
        this.kind = Kind.NUMBER;
    }
    public Value.array() {
        this.arr = new ArrayList<Value>();
        this.kind = Kind.ARRAY;
    }
    public void append(Value v) {
        assert(this.kind == Kind.ARRAY);
        this.arr.add(v);
    }
    public Value.map() {
        this.hashmap = new HashMap<string, Value>();
        this.kind = Kind.MAP;
    }
    public void add(string key, Value val) {
        assert(this.kind == Kind.MAP);
        this.hashmap[key] = val;
    }

    public string to_str() {
        switch (this.kind) {
            case Kind.STRING:
                return "\"" + this.str + "\"";
            case Kind.NUMBER:
                return this.num.to_string();
            case Kind.ARRAY:
                string s = "[";
                bool first = true;
                foreach(Value v in this.arr) {
                    if (!first) {
                        s += ",";
                    }
                    first = false;
                    s += v.to_str();
                }
                s += "]";
                return s;
            case Kind.MAP:
                string s = "{";
                bool first = true;
                foreach (var e in this.hashmap.entries) {
                    if (!first) {
                        s+= ",";
                    }
                    first = false;
                    s += e.key + ":" + e.value.to_str();
                }
                s += "}";
                return s;
        }
        assert_not_reached();
    }

    public static Value parse(string data) {
        int c = 0;
        return parse_inner(data, ref c);
    }
    private static Value parse_inner(string data, ref int offset) {
        unichar c;
        int tmp = offset;
        data.get_next_char (ref tmp, out c);
        while (c.isspace()) {
            data.get_next_char (ref tmp, out c);
        }
        if (c == '{') {
            return parse_map(data, ref offset);
        } else if (c == '[') {
            return parse_array(data, ref offset);
        } else if (c.isdigit() || c == '-') {
            return parse_number(data, ref offset);
        } else if (c == '"') {
            return parse_string(data, ref offset);
        } else {
            message(c.isspace().to_string());
            GLib.error(@"oops $c ");
        }
    }
    private static Value parse_number(string data, ref int offset) {
        unichar c;
        var tmp = offset;
        data.get_next_char (ref offset, out c);
        while (c.isdigit() || c == '-' || c == '.' || c == 'e') {
            data.get_next_char (ref offset, out c);
        }
        return new Value.number(double.parse(data.slice(tmp, -1)));
    }
    private static Value parse_string(string data, ref int offset) {
        int tmp = offset;
        int end = data.index_of("\"", offset+1);
        offset = end;
        data.get_next_char (ref offset, null);
        return new Value.string(data.slice(tmp+1, end));
    }
    private static Value parse_array (string data, ref int offset) {
        var v = new Value.array();
        unichar c;
        data.get_next_char (ref offset, out c);
        while (c == ',' || c == '[') {
            v.append (parse_inner (data, ref offset));
            data.get_next_char (ref offset, out c);
            while (c.isspace()) {
                data.get_next_char (ref offset, out c);
            }
        }
        data.get_next_char (ref offset, out c);
        return v;
    }

    private static Value parse_map (string data, ref int offset) {
        var v = new Value.map();
        unichar c;
        data.get_next_char (ref offset, out c); // skip ","
        while (c != '}') {
            data.get_next_char (ref offset, out c); // skip ","
            while (c.isspace()) {
                data.get_next_char (ref offset, out c);
            }
            int colon = data.index_of(":", offset);
            string ident = data.slice(offset-1, colon);
            offset = colon;
            data.get_next_char (ref offset, out c);
            message(@"$c, $offset");
            v.add (ident, parse_inner (data, ref offset));
            c = data.get_char(offset);
            message(@"$c, $offset");
            while (c.isspace()) {
                data.get_next_char (ref offset, out c);
            }
        }
        data.get_next_char (ref offset, out c);
        message(@"returning with $c");
        return v;
    }

}
