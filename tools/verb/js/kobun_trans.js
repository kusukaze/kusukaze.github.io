function kata_to_hira(ch)
{
    var hiragana = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやいゆえよらりるれろわゐうゑをがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽぁぃぅぇぉゃゅょっん';
    var katakana = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤイユエヨラリルレロワヰウヱヲガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポァィゥェォャュョッン';
    var ans = '';
    for(var i=0;i<ch.length;i++)
    {
        var idx = katakana.indexOf(ch[i]);
        if(idx != -1)
            ans = ans + hiragana[idx];
        else
            ans = ans + ch[i] 
    }
    return ans;
}
function trans(verb,dan,row)
{
    var gojuuonzu = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやいゆえよらりるれろわゐうゑをがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽぁぃぅぇぉん';
    var dans = 'あいうえお';
    pos=gojuuonzu.indexOf(row);
    if(pos < 0)
        return '';
    row = parseInt(pos / 5);
    line = dans.indexOf(dan);
    if(line < 0)
        return dan;
    return gojuuonzu[row*5+line];
}
function katsuyou(verb,op,row)
{
    var ans = verb.slice(0,-1) + trans(verb[verb.length-1],op[0],row);
    if(op.length == 2) {
        ans += op[1];
    }
    return ans;
}
function get_dan(type)
{
    //alert(type);
    if(type[0] == "動") {
        if(type[2] == "変") {
            if(type[1] == "サ") return "sa";
            if(type[1] == "カ") return "ka";
            if(type[1] == "ナ") return "na";
            if(type[1] == "ラ") return "ra";
        }
        if(type[2] == "四") return "4";
        if(type[2] == "上") {
            if(type[3] == "一") return "k1";
            if(type[3] == "二") return "k2";
        }
        if(type[2] == "下") {
            if(type[3] == "一") return "s1";
            if(type[3] == "二") return "s2";
        }
    }
}
function get_row(type)
{
    if(type[0] == "動") {
        return kata_to_hira(type[1]);
    }
}
function get_instruction(dan,idx)
{
    var hyou = {
        "sa": ["せ","し","す","する","すれ","せよ"],
        "za": ["ぜ","じ","ず","ずる","ずれ","ぜよ"],
        "ka": ["こ","き","く","くる","くれ","こ"],
        "na": ["な","に","ぬ","ぬる","ぬれ","ね"],
        "ra": ["ら","り","り","る","れ","れ"],
        "4": ["あ","い","う","う","え","え"],
        "k1": ["い","い","いる","いる","いれ","いよ"],
        "k2": ["い","い","う","うる","うれ","いよ"],
        "s1": ["え","え","える","える","えれ","えよ"],
        "s2": ["え","え","う","うる","うれ","えよ"]
    };
    return hyou[dan][idx];
}
function to_mizen(verb,dan,row)
{
    if(dan == "k1" || dan == "s1") verb = verb.slice(0,-1);
    return katsuyou(verb,get_instruction(dan,0),row);
}
function to_renyou(verb,dan,row)
{
    if(dan == "k1" || dan == "s1") verb = verb.slice(0,-1);
    return katsuyou(verb,get_instruction(dan,1),row);
}
function to_rentai(verb,dan,row)
{
    if(dan == "k1" || dan == "s1") verb = verb.slice(0,-1);
    return katsuyou(verb,get_instruction(dan,3),row);
}
function to_izen(verb,dan,row)
{
    if(dan == "k1" || dan == "s1") verb = verb.slice(0,-1);
    return katsuyou(verb,get_instruction(dan,4),row);
}
function to_meirei(verb,dan,row)
{
    if(dan == "k1" || dan == "s1") verb = verb.slice(0,-1);
    return katsuyou(verb,get_instruction(dan,5),row);
}
function get_result(verb,type,kaki)
{
    ans = kaki + '——';
    ans += type + "\n";

    if(type.slice(2,4) == "特活") {
        ans += "暂不支持此动词。\n\r";
        return ans;
    }
    var dan = get_dan(type);
    var row = get_row(type);
    if(dan == "sa" && verb[verb.length-1] == "ず") {
        dan = "za";
        row = "ざ";
    }
    //alert(row);

    ans = ans + '未然形：\t' + to_mizen(verb,dan,row) + '\n\r';
    ans = ans + '连用形：\t' + to_renyou(verb,dan,row) + '\n\r';
    ans = ans + '终止形：\t' + verb + '\n\r';
    ans = ans + '连体形：\t' + to_rentai(verb,dan,row) + '\n\r';
    ans = ans + '已然形：\t' + to_izen(verb,dan,row) + '\n\r';
    ans = ans + '命令形：\t' + to_meirei(verb,dan,row) + '\n\r';
    

    return ans;
}
