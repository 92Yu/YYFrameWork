define("ace/mode/abc_highlight_rules",["ace_require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function (ace_require, exports, module) {
    "use strict";

    var oop = ace_require("../lib/oop");
    var TextHighlightRules = ace_require("./text_highlight_rules").TextHighlightRules;

    var ABCHighlightRules = function () {

        this.$rules = {
            start: [
                {
                    token: ['zupfnoter.information.comment.line.percentage', 'information.keyword', 'in formation.keyword.embedded'],
                    regex: '(%%%%)(hn\\.[a-z]*)(.*)',
                    comment: 'Instruction Comment'
                },
                {
                    token: ['information.comment.line.percentage', 'information.keyword.embedded'],
                    regex: '(%%)(.*)',
                    comment: 'Instruction Comment'
                },

                {
                    token: 'comment.line.percentage',
                    regex: '%.*',
                    comment: 'Comments'
                },

                {
                    token: 'barline.keyword.operator',
                    regex: '[\\[:]*[|:][|\\]:]*(?:\\[?[0-9]+)?|\\[[0-9]+',
                    comment: 'Bar lines'
                },
                {
                    token: ['information.keyword.embedded', 'information.argument.string.unquoted'],
                    regex: '(\\[[A-Za-z]:)([^\\]]*\\])',
                    comment: 'embedded Header lines'
                },
                {
                    token: ['information.keyword', 'information.argument.string.unquoted'],
                    regex: '^([A-Za-z]:)([^%\\\\]*)',
                    comment: 'Header lines'
                },
                {
                    token: ['text', 'entity.name.function', 'string.unquoted', 'text'],
                    regex: '(\\[)([A-Z]:)(.*?)(\\])',
                    comment: 'Inline fields'
                },
                {
                    token: ['accent.constant.language', 'pitch.constant.numeric', 'duration.constant.numeric'],
                    regex: '([\\^=_]*)([A-Ga-gz][,\']*)([0-9]*/*[><0-9]*)',
                    comment: 'Notes'
                },
                {
                    token: 'zupfnoter.jumptarget.string.quoted',
                    regex: '[\\"!]\\^\\:.*?[\\"!]',
                    comment: 'Zupfnoter jumptarget'
                }, {
                    token: 'zupfnoter.goto.string.quoted',
                    regex: '[\\"!]\\^\\@.*?[\\"!]',
                    comment: 'Zupfnoter goto'
                },
                {
                    token: 'zupfnoter.annotation.string.quoted',
                    regex: '[\\"!]\\^\\!.*?[\\"!]',
                    comment: 'Zupfnoter annoation'
                },
                {
                    token: 'zupfnoter.annotationref.string.quoted',
                    regex: '[\\"!]\\^\\#.*?[\\"!]',
                    comment: 'Zupfnoter annotation reference'
                },
                {
                    token: 'chordname.string.quoted',
                    regex: '[\\"!]\\^.*?[\\"!]',
                    comment: 'abc chord'
                },
                {
                    token: 'string.quoted',
                    regex: '[\\"!].*?[\\"!]',
                    comment: 'abc annotation'
                }

            ]
        };

        this.normalizeRules();
    };

    ABCHighlightRules.metaData = {
        fileTypes: ['abc'],
        name: 'ABC',
        scopeName: 'text.abcnotation'
    };


    oop.inherits(ABCHighlightRules, TextHighlightRules);

    exports.ABCHighlightRules = ABCHighlightRules;
});

define("ace/mode/folding/cstyle",["ace_require","exports","module","ace/lib/oop","ace/range","ace/mode/folding/fold_mode"], function(ace_require, exports, module) {
"use strict";

var oop = ace_require("../../lib/oop");
var Range = ace_require("../../range").Range;
var BaseFoldMode = ace_require("./fold_mode").FoldMode;

var FoldMode = exports.FoldMode = function(commentRegex) {
    if (commentRegex) {
        this.foldingStartMarker = new RegExp(
            this.foldingStartMarker.source.replace(/\|[^|]*?$/, "|" + commentRegex.start)
        );
        this.foldingStopMarker = new RegExp(
            this.foldingStopMarker.source.replace(/\|[^|]*?$/, "|" + commentRegex.end)
        );
    }
};
oop.inherits(FoldMode, BaseFoldMode);

(function() {
    
    this.foldingStartMarker = /([\{\[\(])[^\}\]\)]*$|^\s*(\/\*)/;
    this.foldingStopMarker = /^[^\[\{\(]*([\}\]\)])|^[\s\*]*(\*\/)/;
    this.singleLineBlockCommentRe= /^\s*(\/\*).*\*\/\s*$/;
    this.tripleStarBlockCommentRe = /^\s*(\/\*\*\*).*\*\/\s*$/;
    this.startRegionRe = /^\s*(\/\*|\/\/)#?region\b/;
    this._getFoldWidgetBase = this.getFoldWidget;
    this.getFoldWidget = function(session, foldStyle, row) {
        var line = session.getLine(row);
    
        if (this.singleLineBlockCommentRe.test(line)) {
            if (!this.startRegionRe.test(line) && !this.tripleStarBlockCommentRe.test(line))
                return "";
        }
    
        var fw = this._getFoldWidgetBase(session, foldStyle, row);
    
        if (!fw && this.startRegionRe.test(line))
            return "start"; // lineCommentRegionStart
    
        return fw;
    };

    this.getFoldWidgetRange = function(session, foldStyle, row, forceMultiline) {
        var line = session.getLine(row);
        
        if (this.startRegionRe.test(line))
            return this.getCommentRegionBlock(session, line, row);
        
        var match = line.match(this.foldingStartMarker);
        if (match) {
            var i = match.index;

            if (match[1])
                return this.openingBracketBlock(session, match[1], row, i);
                
            var range = session.getCommentFoldRange(row, i + match[0].length, 1);
            
            if (range && !range.isMultiLine()) {
                if (forceMultiline) {
                    range = this.getSectionRange(session, row);
                } else if (foldStyle != "all")
                    range = null;
            }
            
            return range;
        }

        if (foldStyle === "markbegin")
            return;

        var match = line.match(this.foldingStopMarker);
        if (match) {
            var i = match.index + match[0].length;

            if (match[1])
                return this.closingBracketBlock(session, match[1], row, i);

            return session.getCommentFoldRange(row, i, -1);
        }
    };
    
    this.getSectionRange = function(session, row) {
        var line = session.getLine(row);
        var startIndent = line.search(/\S/);
        var startRow = row;
        var startColumn = line.length;
        row = row + 1;
        var endRow = row;
        var maxRow = session.getLength();
        while (++row < maxRow) {
            line = session.getLine(row);
            var indent = line.search(/\S/);
            if (indent === -1)
                continue;
            if  (startIndent > indent)
                break;
            var subRange = this.getFoldWidgetRange(session, "all", row);
            
            if (subRange) {
                if (subRange.start.row <= startRow) {
                    break;
                } else if (subRange.isMultiLine()) {
                    row = subRange.end.row;
                } else if (startIndent == indent) {
                    break;
                }
            }
            endRow = row;
        }
        
        return new Range(startRow, startColumn, endRow, session.getLine(endRow).length);
    };
    this.getCommentRegionBlock = function(session, line, row) {
        var startColumn = line.search(/\s*$/);
        var maxRow = session.getLength();
        var startRow = row;
        
        var re = /^\s*(?:\/\*|\/\/|--)#?(end)?region\b/;
        var depth = 1;
        while (++row < maxRow) {
            line = session.getLine(row);
            var m = re.exec(line);
            if (!m) continue;
            if (m[1]) depth--;
            else depth++;

            if (!depth) break;
        }

        var endRow = row;
        if (endRow > startRow) {
            return new Range(startRow, startColumn, endRow, line.length);
        }
    };

}).call(FoldMode.prototype);

});

define("ace/mode/abc",["ace_require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/abc_highlight_rules","ace/mode/folding/cstyle"], function (ace_require, exports, module) {
    "use strict";

    var oop = ace_require("../lib/oop");
    var TextMode = ace_require("./text").Mode;
    var ABCHighlightRules = ace_require("./abc_highlight_rules").ABCHighlightRules;
    var FoldMode = ace_require("./folding/cstyle").FoldMode;

    var Mode = function () {
        this.HighlightRules = ABCHighlightRules;
        this.foldingRules = new FoldMode();
        this.$behaviour = this.$defaultBehaviour;
    };
    oop.inherits(Mode, TextMode);

    (function () {
        this.$id = "ace/mode/abc";
        this.snippetFileId = "ace/snippets/abc";
    }).call(Mode.prototype);

    exports.Mode = Mode;
});                (function() {
                    window.ace_require(["ace/mode/abc"], function(m) {
                        if (typeof module == "object" && typeof exports == "object" && module) {
                            module.exports = m;
                        }
                    });
                })();
            