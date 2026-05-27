using Gee;

public class Libellus.Data {
    public Data (string data) {
        int offset = 0;
        Value v = Value.parse (data, ref offset);
        message (v.to_str());
    }
}

public class Value: Object {
    public static Value from_str(string data) {
        int offset = 0;
        return parse(data, ref offset);
    }
    public static Value parse(string data, ref int offset) {
        unichar c;
        Value.trim(data, ref offset);
        int _tmp = offset;
        data.get_next_char(ref _tmp, out c);
        if (c == '{') {
            return new MapValue.from_str(data, ref offset);
        } else if (c == '[') {
            return new ArrValue.from_str(data, ref offset);
        } else if (c.isdigit() || c == '-') {
            return new NumValue.from_str(data, ref offset);
        } else if (c == '"') {
            return new StrValue.from_str(data, ref offset);
        }
        GLib.error(@"expected '[', '{', '\"' or number but got '$c' at $offset");
    }
    public static void trim(string data, ref int offset) {
        unichar c;
        int next = offset;
        data.get_next_char (ref next, out c);
        while (c.isspace() || c == '\n') {
            offset = next;
            data.get_next_char (ref next, out c);
        }
    }
    public static unichar peek(string data, int offset) {
        unichar c;
        data.get_next_char (ref offset, out c);
        return c;
    }
    public string to_str () {
        switch (this.kind) {
            case Kind.ARR:
                return ((ArrValue) this).to_str ();
            case Kind.STR:
                return ((StrValue) this).to_str ();
            case Kind.NUM:
                return ((NumValue) this).to_str ();
            case Kind.MAP:
                return ((MapValue) this).to_str ();
       }
       GLib.error("can't sreialize");
    }
    public enum Kind {
        NONE,
        ARR,
        STR,
        NUM,
        MAP,
    }
    public Kind kind = Kind.NONE;
}

public class NumValue: Value {
    public double num;
    public NumValue (double v) {
        this.kind = Kind.NUM;
        this.num = v;
    }
    public string to_str() {
        return this.num.to_string();
    }
    public NumValue.from_str(string data, ref int offset) {
        this.kind = Kind.NUM;
        unichar c;
        var start = offset;
        data.get_next_char (ref offset, out c);
        while (c.isdigit() || c == '-' || c == '.' || c == 'e') {
            data.get_next_char (ref offset, out c);
        }
        this.num = double.parse(data.slice(start, -1));
        data.get_prev_char(ref offset, out c);
    }
}

public class StrValue: Value {
    public string str;
    public StrValue (string v) {
        this.kind = Kind.STR;
        this.str = v;
    }
    public string to_str() {
        return "\"" + this.str + "\"";
    }
    public StrValue.from_str(string data, ref int offset) {
        this.kind = Kind.STR;
        int tmp = offset;
        int end = data.index_of("\"", offset+1);
        offset = end;
        data.get_next_char (ref offset, null);
        this.str = data.slice(tmp+1, end);
    }
}

public class ArrValue: Value {
    public ArrayList<Value> arr;
    public ArrValue () {
        this.kind = Kind.ARR;
        this.arr = new ArrayList<Value>();
    }
    public string to_str () {
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
    }
    public ArrValue.from_str(string data, ref int offset) throws Error {
        this.kind = Kind.ARR;
        this.arr = new ArrayList<Value>();
        unichar c;
        data.get_next_char (ref offset, out c);
        if (c != '[') {
            throw new Error(0, 0, @"expected '[' but got '$c'");
        }
        Value.trim(data, ref offset);
        if (Value.peek(data, offset) == ']') {
            data.get_next_char (ref offset, out c);
            return;
        }
        while (c == ',' || c == '[') {
            Value.trim(data, ref offset);
            this.arr.add (Value.parse (data, ref offset));
            Value.trim(data, ref offset);
            data.get_next_char (ref offset, out c);
        }
        if (c != ']') {
            throw new Error(0, 0, @"expected ']' but got '$c'");
        }
    }
}

public class MapValue: Value {
    public HashMap<string, Value> map;
    public MapValue () {
        this.kind = Kind.MAP;
        this.map = new HashMap<string, Value>();
    }
    public string to_str () {
        string s = "{";
        bool first = true;
        foreach (var e in this.map.entries) {
            if (!first) {
                s+= ",";
            }
            first = false;
            s += e.key + ":" + e.value.to_str();
        }
        s += "}";
        return s;
    }
    public MapValue.from_str (string data, ref int offset) throws Error {
        this.kind = Kind.MAP;
        this.map = new HashMap<string, Value>();
        unichar c;
        data.get_next_char (ref offset, out c); // skip "{"
        if (c != '{') {
            throw new Error(0, 0, @"expected '{' but got $c");
        }
        while (c != '}') {
            Value.trim(data, ref offset);
            int colon = data.index_of(":", offset);
            if (colon == -1) {
                throw new Error(0, 0, @"expected ':' but never found it near $offset");
            }
            string ident = data.slice(offset, colon).strip();
            offset = colon;
            data.get_next_char (ref offset, out c);
            if (c != ':') {
                throw new Error(0, 0, @"expected ':' but got '$c'");
            }
            this.map[ident] = Value.parse (data, ref offset);
            c = data.get_char(offset);
            Value.trim(data, ref offset);
            data.get_next_char (ref offset, out c); // skip ","
            if (c != ',' && c != '}') {
                throw new Error(0, 0, @"expected ',' or '}' but got '$c'");
            }
        }
    }
}
